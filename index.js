const { Command } = require('commander')

const Context = require('./lib/context')
const projectsCommand = require('./commands/projects')
const filesCommand = require('./commands/files')
const meta = require('./package.json')

exports.run = (cwd, argv) => {
  const program = new Command()
  Context.current = new Context(cwd)
  Context.current.log(`Running mono in ${cwd}`, {style: 'muted'})


  program
    .name("mono")
    .description("Manage a monorepo without all the pain.")
    .version(meta.version)

  program.addCommand(projectsCommand())
  program.addCommand(filesCommand())

  program.parse(argv)
}