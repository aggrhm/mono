const yaml = require('yaml')
const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

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
    console.log(contents)
    this.config = yaml.parse(contents)
  }

  getProjects() {
    return Object.entries(this.config.projects).map(([key, conf])=>{
      return new Project(this, {...conf, key: key})
    })
  }

  async exec(cmd) {
    try {
      const { stdout, stderr } = await exec(cmd)
    } catch (e) {
      console.error(e)
    }
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

module.exports = Configuration