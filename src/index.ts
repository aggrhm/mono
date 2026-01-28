import { Command } from 'commander'
const Context = require('../lib/context')
const projectsCommand = require('../commands/projects')
const filesCommand = require('../commands/files')
import meta from '../package.json'

export const run = (cwd: string, argv: string[]) => {
  const program = new Command()
  Context.current = new Context(cwd)
  Context.current.log(`Running mono in ${cwd}`, { style: 'muted' })

  program
    .name('mono')
    .description('Manage a monorepo without all the pain.')
    .version((meta as any).version)

  program.addCommand(projectsCommand())
  program.addCommand(filesCommand())

  program.parse(argv)
}
