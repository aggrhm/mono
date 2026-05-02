import fs from "fs"
import path from "path"
import chalk from "chalk"

import Context from './context'

type ProjectConfig = {
  key: string
  name: string
  path: string
  repository: string
  ref: string
  groups: string[]
}

export default class Project {

  context: Context
  key : string
  name : string
  path : string
  repository : string | undefined
  groups : string[] | undefined
  ref : string
  dependencies : string[] | undefined

  constructor(context : Context, config: ProjectConfig) {
    this.context = context
    this.key = config.key
    Object.assign(this, config)

    this.name ||= this.key
    this.path ||= "/"
    this.ref ||= "main"
    if (!this.path.endsWith("/")) {
      this.path = this.path + "/"
    }
  }

  get relativeInstallPath() {
    return `${this.path}${this.key}`
  }
  get installPath() {
    return `${this.context.rootPath}/${this.relativeInstallPath}`
  }
  get installParentPath() {
    return path.dirname(this.installPath)
  }
  get repositoryURL() {
    if (this.repository?.includes("://")) {
      // full url already defined
      return this.repository
    }
    if (this.context.getSetting('git_protocol') == 'ssh') {
      // use ssh URL
      return `git@github.com:${this.repository}.git`
    } else {
      // use https url
      return `https://github.com/${this.repository}.git`
    }
  }

  isInstalled() {
    return fs.existsSync(this.installPath)
  }

  hasAnyGroups(groups : string[]) {
    return this.groups && this.groups.some(group => groups.includes(group))
  }

  async isRemoteAccessible() {
    try {
      const ctx = this.context
      // check if can call ls-remote on remote repository
      await this.context.execIn(ctx.rootPath, `GIT_TERMINAL_PROMPT=0 git ls-remote --heads ${this.repositoryURL} HEAD`, { suppressOutput: true, suppressErrors: true })
      return true
    } catch (e) {
      return false
    }
  }

  check() {
    const ctx = this.context
    console.log(`Checking ${this.name} at ${this.relativeInstallPath}`)
    const status = this.isInstalled()
      ? chalk.green("installed")
      : chalk.red("not installed")
    ctx.log(`Status: ${status}`, { style: "detail" })
  }

  async install() {
    const ctx = this.context

    console.log(`Installing ${this.name} to ${this.relativeInstallPath}`)

    // skip if installed
    if (this.isInstalled()) {
      ctx.log("Already installed, skipping", { style: "detail" })
      return
    }

    // skip if inaccessible
    if (!(await this.isRemoteAccessible())) {
      ctx.log("Remote repository inaccessible, skipping", { style: "detail" })
      return
    }

    // prepare directory
    fs.mkdirSync(this.installParentPath, { recursive: true })

    // clone
    const cmd = `git clone ${this.repositoryURL} ${this.relativeInstallPath}`
    await ctx.execIn(ctx.rootPath, cmd)
    ctx.log("Installed", { style: "detail" })

    // add to git ignore
    if (ctx.ensureGitIgnored(this.relativeInstallPath)) {
      ctx.log("Added to .gitignore", { style: "detail" })
    }

    // sync to ref
    await ctx.execIn(this.relativeInstallPath, `git checkout ${this.ref}`)
    ctx.log(`Ref: ${this.ref} checked out`, { style: "detail" })
  }

  async uninstall() {
    const ctx = this.context
    console.log(`Uninstalling ${this.name} at ${this.relativeInstallPath}`)
    if (!this.isInstalled()) {
      ctx.log("Already uninstalled, skipping", { style: "detail" })
      return
    }

    // remove
    fs.rmSync(this.installPath, { recursive: true, force: true })
    ctx.log("Uninstalled", { style: "detail" })
  }

  async reinstall() {
    await this.uninstall()
    await this.install()
  }

  async sync() {
    const ctx = this.context

    if (!this.isInstalled()) {
      ctx.log("Not installed, skipping", { style: "detail" })
      return
    }
    // checkout ref
    ctx.log(`Syncing ${this.name} to ${this.ref}`)
    await ctx.execIn(this.relativeInstallPath, `git pull`)
    ctx.log(`Up-to-date`, { style: "detail" })

    await ctx.execIn(this.relativeInstallPath, `git checkout ${this.ref}`)
    ctx.log(`Ref: ${this.ref} checked out`, { style: "detail" })
  }

  async run(options : { script : string }) {
    const ctx = this.context
    const script = options.script

    const script_path = `${this.installPath}/${script}`
    ctx.log(`Running ${script} for ${this.name}`)

    if (!this.isInstalled()) {
      ctx.log("Not installed, skipping", { style: "detail" })
      return
    }
    // Ensure script present
    if (fs.existsSync(script_path)) {
      await ctx.execIn(this.relativeInstallPath, `./${script}`)
    } else {
      ctx.log(`Script ${script} not found for ${this.name}`, { style: "detail" })
    }
  }

  async setup() {
    await this.run({ script: "setup.sh" })
  }
}

module.exports = Project
