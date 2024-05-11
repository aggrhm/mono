const { Command } = require('commander')
const Context = require('../lib/context')

function filesCommand() {
  const files = new Command('files')

  files
    .command('check')
    .description('Check state of files')
    .argument('[files...]')
    .action(check)
  files
    .command('download')
    .description('Download files to this monorepo')
    .argument('[files...]')
    .action(download)

  return files
}

async function check(file_names, options) {
  await Context.current.runForFiles({
    action: 'check',
    only: file_names,
    options: options,
  })
}

async function download(file_names, options) {
  await Context.current.runForFiles({
    action: 'download',
    only: file_names,
    options: options,
  })
}

module.exports = filesCommand
