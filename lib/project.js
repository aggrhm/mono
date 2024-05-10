const fs = require('fs')
const path = require('path')

class Project {

  constructor(context, conf) {
    this.context = context
    Object.assign(this, conf)
    this.name ||= this.key
    this.path ||= "/"
  }

  get relativeInstallPath() {
    return `${this.path}/${this.key}`
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

  async install() {
    const ctx = this.context

    console.log(`Installing project ${this.name} to ${this.relativeInstallPath}`)
    if (this.isInstalled()) {
      console.log("+ Already installed, skipping")
      return
    }

    // clone
    const cmd = `gittt clone ${this.repository} ${this.relativeInstallPath}`
    await ctx.exec(cmd)
    console.log("+ Installed")

    // add to git ignore
    if (ctx.ensureGitIgnored(this.relativeInstallPath)) {
      console.log("+ Added to .gitignore")
    }

    // checkout ref
    ctx.exec(`cd ${this.relativeInstallPath} && git checkout ${this.ref}`)
    console.log(`+ Ref: ${this.ref} checked out`)
  }

}

module.exports = Project