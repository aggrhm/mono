import { Command } from 'commander'

import Context from './lib/context'
import projectsCommand from './commands/projects'
import meta from '../package.json'

exports.run = (cwd : string, argv: string[]) => {
  const program = new Command()
  Context.current = new Context(cwd)
  Context.current.log(`Running mono in ${cwd}`, {style: 'muted'})


  program
    .name("mono")
    .description("Manage a monorepo without all the pain.")
    .version(meta.version)

  program.addCommand(projectsCommand())

  program.parse(argv)
}