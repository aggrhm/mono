const { Command } = require('commander')
const Context = require('../lib/context')

function projectsCommand() {
  const projects = new Command('projects')

  projects
    .command('install')
    .action(install)

  return projects
}

function install(options) {
  console.log("Installing projects.")
  // load manifest
  const context = Context.current

  // install projects
  for (const project of context.getProjects()) {
    project.install()
  }
  //const projects = monoConfig.getProjects()
  // for each project, call project.clone()
  // git clone
  // add to ignore
}

module.exports = projectsCommand