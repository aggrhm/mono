const yaml = require('yaml')
const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const chalk = require('chalk')

const Project = require('./project')

class Context {
  constructor(cwd) {
    this.rootPath = cwd
    this.load()
  }

  load() {
    // load yaml file
    const path = this.rootPath + "/mono.yml"
    const contents = fs.readFileSync(path, 'utf8')
    this.config = yaml.parse(contents)
  }

  getProjects() {
    return Object.entries(this.config.projects).map(([key, conf])=>{
      return new Project(this, {...conf, key: key})
    })
  }

  getProjectsMap() {
    return this.getProjects().reduce((memo, project)=> {
      memo[project.key] = project
      return memo
    }, {})
  }

  findProjects({withNames, includeDependencies}) {
    let projectMap = this.getProjectsMap()
    function getDeps(keys) {
      return keys.map((key)=>{
        const deps = projectMap[key].dependencies || []
        return [key].concat(getDeps(deps))
      })
    }
    let allKeys = withNames
    if (includeDependencies) {
      allKeys = new Set(getDeps(withNames).flat(Infinity))
    }

    let projects = Array.from(allKeys).map((key)=> projectMap[key])
    return projects
  }

  async runForProjects({action, only, options, includeDependencies}) {
    // find projects that matter
    const filtered = only != null && only.length > 0
    let projects = null;
    if (filtered) {
      projects = this.findProjects({withNames: only, includeDependencies})
    } else {
      projects = this.getProjects()
    }

    this.log(`Performing [${action}] for ${projects.length} project(s).`, {style: 'info'})
    for (const project of projects) {
      await project[action](options)
    }
  }

  async execIn(path, cmd) {
    try {
      const fullCmd = `cd ${path} && ${cmd}`
      const { stdout, stderr } = await exec(fullCmd)
    } catch (e) {
      throw e
    }
  }

  log(msg, {style}={}) {
    switch (style) {
      case 'muted':
        msg = chalk.grey.bold(msg)
        break;
      case 'info':
        msg = chalk.blue(msg)
        break;
      case 'detail':
        msg = chalk.grey("└─ ") + msg
        break;
    }
    console.log(msg)
  }

  ensureGitIgnored(path) {
    // check if present
    const ignorePath = this.rootPath + "/.gitignore"
    const contents = fs.readFileSync(ignorePath)
    if (!contents.includes(path)) {
      fs.appendFileSync(ignorePath, `\n${path}`)
      return true
    }
    return false
  }
}

module.exports = Context