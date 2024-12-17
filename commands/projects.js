const { Command } = require('commander')
const Context = require('../lib/context')

function projectsCommand() {
  const projects = new Command('projects')

  projects
    .command('check')
    .description('Check state of projects')
    .argument('[projects...]')
    .action(buildRunner('check'))
  projects
    .command('install')
    .description('Install all projects to this monorepo')
    .argument('[projects...]')
    .action(buildRunner('install'))
  projects
    .command('sync')
    .description('Checkout all projects to the appropriate ref/branch')
    .argument('[projects...]')
    .action(buildRunner('sync'))
  projects
    .command('run')
    .description('Run script or command in all projects')
    .argument('[projects...]')
    .option('-s', '--script <script>', 'script to run')
    .action(buildRunner('run'))
  projects
    .command('setup')
    .description('Run setup script in all projects')
    .argument('[projects...]')
    .action(buildRunner('setup'))
  projects
    .command('uninstall')
    .description('Uninstall projects in this monorepo')
    .argument('[projects...]')
    .action(buildRunner('uninstall'))

  return projects
}

function buildRunner(action) {
  return async function(proj_names, options) {
    await Context.current.runForProjects({
      action: action,
      only: proj_names,
      options: options,
      includeDependencies: true
    })
  }
}

module.exports = projectsCommand