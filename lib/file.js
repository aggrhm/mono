const { GetObjectCommand } = require("@aws-sdk/client-s3")
const { GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager")
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

class File {

  constructor(context, conf) {
    this.context = context
    Object.assign(this, conf)
    this.name ||= this.key
  }

  get installParentPath() {
    return path.dirname(this.path)
  }

  isInstalled() {
    return fs.existsSync(this.path)
  }

  check() {
    const ctx = this.context
    ctx.log(`Checking ${this.name} at ${this.path}`)
    const status = this.isInstalled() ? chalk.green("installed") : chalk.red("not installed")
    ctx.log(`Status: ${status}`, {style: 'detail'})
  }

  async download() {
    const ctx = this.context

    ctx.log(`Downloading ${this.name} to ${this.path} from ${this.source}`)

    fs.mkdirSync(this.installParentPath, {recursive: true})

    switch(this.source) {
      case "s3":
        await this.downloadFromS3()
        break;
      case "AWSSecretsManager":
        await this.downloadFromAWSSM()
        break;
    }
    ctx.log("Downloaded", {style: 'detail'})

    if (ctx.ensureGitIgnored(this.path)) {
      ctx.log("Added to .gitignore", {style: 'detail'})
    }
  }

  async downloadFromS3() {
    const ctx = this.context

    const client = ctx.getS3Client()

    const data = {
      "Bucket": this.bucket,
      "Key": this.key
    }

    const resp = await client.send(new GetObjectCommand(data))

    await new Promise((resolve, reject)=>{
      resp.Body.pipe(fs.createWriteStream(this.path))
        .on('error', err=> reject(err))
        .on('close', () => resolve())
    })
  }

  async downloadFromAWSSM() {
    const ctx = this.context

    const client = ctx.getAWSSMClient()
    const export_pfx = this.export ? 'export ' : ''

    const cmd = new GetSecretValueCommand({
      SecretId: this.secret_id
    })
    const resp = await client.send(cmd)
    const json = JSON.parse(resp.SecretString)
    const str = Object.entries(json).map(( [key, val])=> {
      return `${export_pfx}${key}=${val}`
    }).join("\n")
    fs.writeFileSync(this.path, str)
  }

}

module.exports = File