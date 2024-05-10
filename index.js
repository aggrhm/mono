const { Command } = require('commander')

const Context = require('./lib/context')
const projectsCommand = require('./commands/projects')
const meta = require('./package.json')

exports.run = (cwd, argv) => {
  console.log(`Running mono in ${cwd}.`)

  const program = new Command()
  Context.current = new Context(cwd)

  program
    .name("mono")
    .description("Manage a monorepo without all the pain.")
    .version(meta.version)

  program.addCommand(projectsCommand())
  program.parse(argv)
}