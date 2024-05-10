const { Command } = require('commander')
const Context = require('../lib/context')

function projectsCommand() {
  const projects = new Command('projects')

  projects
    .command('check')
    .description('Check state of projects')
    .argument('[projects...]')
    .action(check)
  projects
    .command('install')
    .description('Install all projects to this monorepo')
    .argument('[projects...]')
    .action(install)
  projects
    .command('sync')
    .description('Checkout all projects to the appropriate ref/branch')
    .argument('[projects...]')
    .action(sync)

  return projects
}

async function check(proj_names, options) {
  await Context.current.runForProjects({
    action: 'check',
    only: proj_names,
    options: options,
    includeDependencies: true
  })
}

async function install(proj_names, options) {
  await Context.current.runForProjects({
    action: 'install',
    only: proj_names,
    options: options,
    includeDependencies: true
  })
}

async function sync(proj_names, options) {
  await Context.current.runForProjects({
    action: 'sync',
    only: proj_names,
    options: options,
    includeDependencies: true
  })
}

module.exports = projectsCommand