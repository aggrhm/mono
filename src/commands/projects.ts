import { Command } from 'commander'
import Context from '../lib/context'

export default function projectsCommand() {
  const projects = new Command('projects')
  projects.argument('[projects...]')
  projects.option('-g, --group <groups...>', 'Filter projects by group')
  projects.option('-n, --name <names...>', 'Filter projects by name')

  projects
    .command('check')
    .description('Check state of projects')
    .action(buildRunner())
  projects
    .command('install')
    .description('Install all projects to this monorepo')
    .action(buildRunner())
  projects
    .command('sync')
    .description('Checkout all projects to the appropriate ref/branch')
    .option('--match-current', "If the host repo's current branch exists in a project, check that out instead of the configured ref")
    .action(buildRunner())
  projects
    .command('run')
    .description('Run script or command in all projects')
    .option('-s', '--script <script>', 'Script to run')
    .action(buildRunner())
  projects
    .command('setup')
    .description('Run setup script in all projects')
    .action(buildRunner())
  projects
    .command('uninstall')
    .description('Uninstall projects in this monorepo')
    .action(buildRunner())
  projects
    .command('reinstall')
    .description('Reinstall projects in this monorepo')
    .action(buildRunner())

  return projects
}

function buildRunner() {
  return async function(this: Command) {
    const cmd = this
    await Context.current!.runCommandForProjects(cmd)
  }
}