const yaml = require("yaml")
const fs = require("fs")
const util = require("util")
const exec = util.promisify(require("child_process").exec)
const chalk = require("chalk")
const { S3Client } = require("@aws-sdk/client-s3")
const { SecretsManagerClient } = require("@aws-sdk/client-secrets-manager")

const Project = require("./project")
const File = require("./file")

class Context {
  constructor(cwd) {
    this.rootPath = cwd
    this.load()
  }

  get envKeyPrefix() {
    return `${this.config.name.toUpperCase()}_`
  }

  load() {
    // load yaml file
    const path = this.rootPath + "/mono.yml"
    const contents = fs.readFileSync(path, "utf8")
    this.config = yaml.parse(contents)
  }

  getProjects() {
    return Object.entries(this.config.projects || []).map(([key, conf]) => {
      return new Project(this, { ...conf, key: key })
    })
  }

  getFiles() {
    return Object.entries(this.config.files || []).map(([key, conf]) => {
      return new File(this, { ...conf, key: key })
    })
  }

  getProjectsMap() {
    return this.getProjects().reduce((memo, project) => {
      memo[project.key] = project
      return memo
    }, {})
  }

  getFilesMap() {
    return this.getFiles().reduce((memo, file) => {
      memo[file.key] = file
      return memo
    }, {})
  }

  findProjects({ withNames, includeDependencies }) {
    let projectMap = this.getProjectsMap()
    function getDeps(keys) {
      return keys.map((key) => {
        const deps = projectMap[key].dependencies || []
        return [key].concat(getDeps(deps))
      })
    }
    let allKeys = withNames
    if (includeDependencies) {
      allKeys = new Set(getDeps(withNames).flat(Infinity))
    }

    let projects = Array.from(allKeys).map((key) => projectMap[key])
    return projects
  }

  findFiles({ withNames }) {
    const filesMap = this.getFilesMap()
    let files = withNames.map((key) => filesMap[key])
    return files
  }

  async runForProjects({ action, only, options, includeDependencies }) {
    // find projects that matter
    const filtered = only != null && only.length > 0
    let projects = null
    if (filtered) {
      projects = this.findProjects({ withNames: only, includeDependencies })
    } else {
      projects = this.getProjects()
    }

    this.log(`Performing [${action}] for ${projects.length} project(s).`, {
      style: "info",
    })
    for (const project of projects) {
      await project[action](options)
    }
  }

  async runForFiles({ action, only, options }) {
    const filtered = only != null && only.length > 0
    let files = null
    if (filtered) {
      projects = this.findFiles({ withNames: only })
    } else {
      files = this.getFiles()
    }

    this.log(`Performing [${action}] for ${files.length} files(s).`, {
      style: "info",
    })
    for (const file of files) {
      await file[action](options)
    }
  }

  async execIn(path, cmd) {
    try {
      const fullCmd = `cd ${path} && ${cmd}`
      const promise = exec(fullCmd)
      const child = promise.child
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
      const { stdout, stderr } = await promise
    } catch (e) {
      throw e
    }
  }

  log(msg, { style } = {}) {
    switch (style) {
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

  envKey(key) {
    return `${this.envKeyPrefix}${key.toUpperCase()}`
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

  getS3Client() {
    const regionVar = this.envKey("AWS_REGION")
    const keyVar = this.envKey("AWS_ACCESS_KEY_ID")
    const secretVar = this.envKey("AWS_SECRET_ACCESS_KEY")
    const client = new S3Client({
      region: process.env[regionVar],
      credentials: {
        accessKeyId: process.env[keyVar],
        secretAccessKey: process.env[secretVar],
      },
    })
    return client
  }

  getAWSSMClient() {
    const regionVar = this.envKey("AWS_REGION")
    const keyVar = this.envKey("AWS_ACCESS_KEY_ID")
    const secretVar = this.envKey("AWS_SECRET_ACCESS_KEY")
    const client = new SecretsManagerClient({
      region: process.env[regionVar],
      credentials: {
        accessKeyId: process.env[keyVar],
        secretAccessKey: process.env[secretVar],
      },
    })
    return client
  }
}

module.exports = Context
