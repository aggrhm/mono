const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

class Project {

  constructor(context, conf) {
    this.context = context
    Object.assign(this, conf)
    this.name ||= this.key
    this.path ||= "/"
    if (!this.path.endsWith("/")) { this.path = this.path + "/" }
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

  isInstalled() {
    return fs.existsSync(this.installPath)
  }

  check() {
    const ctx = this.context
    console.log(`Checking ${this.name} at ${this.relativeInstallPath}`)
    const status = this.isInstalled() ? chalk.green("installed") : chalk.red("not installed")
    ctx.log(`Status: ${status}`, {style: 'detail'})
  }

  async install() {
    const ctx = this.context

    console.log(`Installing ${this.name} to ${this.relativeInstallPath}`)
    if (this.isInstalled()) {
      ctx.log("Already installed, skipping", {style: 'detail'})
      return
    }

    // prepare directory
    fs.mkdirSync(this.installParentPath, {recursive: true})

    // clone
    const cmd = `git clone ${this.repository} ${this.relativeInstallPath}`
    await ctx.execIn(ctx.rootPath, cmd)
    ctx.log("Installed", {style: 'detail'})

    // add to git ignore
    if (ctx.ensureGitIgnored(this.relativeInstallPath)) {
      ctx.log("Added to .gitignore", {style: 'detail'})
    }

    // sync to ref
    await ctx.execIn(this.relativeInstallPath, `git checkout ${this.ref}`)
    ctx.log(`Ref: ${this.ref} checked out`, {style: 'detail'})
  }

  async sync() {
    const ctx = this.context
    // checkout ref
    ctx.log(`Syncing ${this.name} to ${this.ref}`)
    await ctx.execIn(this.relativeInstallPath, `git pull`)
    ctx.log(`Up-to-date`, {style: 'detail'})

    await ctx.execIn(this.relativeInstallPath, `git checkout ${this.ref}`)
    ctx.log(`Ref: ${this.ref} checked out`, {style: 'detail'})

  }

  async run({script}) {
    // Ensure script present
    const script_path = `${this.relativeInstallPath}/setup.sh`
    if (fp.existsSync(script_path)) {
      ctx.log(`Running ${script_path} for ${this.name}`)
      await ctx.execIn(this.relativeInstallPath, `./${script}`)
    } else {
      ctx.log(`Script ${script} not found for ${this.name}`)
    }
  }

  async setup() {
    this.run({script: 'setup.sh'})
  }

}

module.exports = Project