import yaml from 'yaml'
import fs from 'fs'
import util from 'util'
import chalk from 'chalk'

import Project from './project'
import { Command } from 'commander'

const exec = util.promisify(require("child_process").exec)

type ContextConfig = {
  name: string
  env_key_prefix: string
  settings: Record<string, any>
  projects: Record<string, any>
  files: Record<string, any>
}

export default class Context {

  static current : Context | undefined
  rootPath: string
  config: ContextConfig | undefined

  constructor(cwd : string) {
    this.rootPath = cwd
    this.load()
  }

  get settings() {
    return this.config?.settings
  }

  get hostType() {
    if (process.env.CODESPACES == 'true') {
      return 'codespace'
    } else if (process.env.REMOTE_CONTAINERS == 'true') {
      return 'remote_container'
    } else {
      return 'local'
    }
  }

  get hasGithubToken() {
    return (!!process.env.GITHUB_TOKEN)
  }

  get envKeyPrefix() {
    if (this.config?.env_key_prefix) {
      return this.config?.env_key_prefix
    } else {
      return `${this.config?.name.toUpperCase()}_`
    }
  }

  load() {
    // load yaml file
    const path = this.rootPath + "/mono.yml"
    const contents = fs.readFileSync(path, "utf8")
    this.config = yaml.parse(contents) as ContextConfig

    // establish defaults
    this.config.settings ||= {}
    this.config.projects ||= {}
    this.config.files ||= []
    this.config.settings.git_protocol ||= 'https'
    return this.config
  }

  getSetting(key : string) {
    // check env var first
    const env_key = `MONO_${key.toUpperCase()}`
    if (process.env[env_key]) {
      return process.env[env_key]
    } else {
      return this.config?.settings[key]
    }
  }

  getProjects() {
    return Object.entries(this.config?.projects || []).map(([key, conf]) => {
      return new Project(this, { ...conf, key: key })
    })
  }

  getProjectsMap() {
    return this.getProjects().reduce((memo : Record<string, Project>, project : Project) => {
      memo[project.key!] = project
      return memo
    }, {})
  }

  findProjects({ withNames, withGroups }: { withNames?: string[], withGroups?: string[] }) {
    // find all projects with either these names or groups
    const filteredProjects = this.getProjects().filter((p) => {
      if (withNames && withNames.includes(p.key)) {
        return true
      }
      if (withGroups && p.hasAnyGroups(withGroups)) {
        return true
      }
      return false
    })
    return filteredProjects
  }

  expandProjectDependencies(projects : Project[]) {
    let projectMap = this.getProjectsMap()
    function getDeps(keys : string[]) {
      return keys.map( (key : string ) : any[] => {
        const deps = projectMap[key].dependencies || []
        //return [key].concat(getDeps(deps))
        return getDeps(deps).concat([key])
      })
    }

    const initialKeys = projects.map((p) => p.key)
    const allKeys = new Set(getDeps(initialKeys).flat(Infinity))
    return Array.from(allKeys).map((key) => projectMap[key])
  }

  async runCommandForProjects(cmd : Command) {
    // find projects that matter
    const action = cmd.name() as string
    const selectedNames = cmd.parent!.opts().name as string[]
    const selectedGroups = cmd.parent!.opts().group as string[]
    const selectedFlex = cmd.args
    const options = cmd.options

    let projects = []
    if (selectedNames) {
      projects = this.findProjects({ withNames: selectedNames })
    } else if (selectedGroups) {
      projects = this.findProjects({ withGroups: selectedGroups })
    } else if (selectedFlex.length > 0) {
      projects = this.findProjects({ withNames: selectedFlex, withGroups: selectedFlex })
    } else {
      projects = this.getProjects()
    }

    projects = this.expandProjectDependencies(projects)

    this.log(`Performing [${action}] for ${projects.length} project(s).`, { style: "info" })
    for (const project of projects) {
      await (project as any)[action](options)
    }
  }

  async execIn(path: string, cmd: string, options: { suppressOutput?: boolean, suppressErrors?: boolean } = {}) {
    try {
      const fullPath = this.expandPath(path)
      const promise = exec(cmd, {cwd: fullPath})
      const child = promise.child
      if (!options.suppressOutput) {
        child.stdout.pipe(process.stdout)
      }
      if (!options.suppressErrors) {
        child.stderr.pipe(process.stderr)
      }
      const { stdout, stderr } = await promise
    } catch (e) {
      throw e
    }
  }

  log(msg : string, options: { style?: string } = {}) {
    switch (options.style) {
      case "muted":
        msg = chalk.grey.bold(msg)
        break;
      case "info":
        msg = chalk.blue(msg)
        break;
      case "detail":
        msg = chalk.grey("└─ ") + msg
        break;
    }
    console.log(msg)
  }

  envKey(key : string) {
    return `${this.envKeyPrefix}${key.toUpperCase()}`
  }

  ensureGitIgnored(path : string) {
    // check if present
    const ignorePath = this.rootPath + "/.gitignore"
    const contents = fs.readFileSync(ignorePath)
    if (!contents.includes(path)) {
      fs.appendFileSync(ignorePath, `\n${path}`)
      return true
    }
    return false
  }

  expandPath(path : string) {
    if (path.startsWith("/")) {
      return path
    } else {
      return (this.rootPath + "/" + path)
    }
  }

}
