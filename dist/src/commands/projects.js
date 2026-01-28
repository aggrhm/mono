"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = projectsCommand;
const commander_1 = require("commander");
const context_1 = __importDefault(require("../lib/context"));
function projectsCommand() {
    const projects = new commander_1.Command('projects');
    projects.argument('[projects...]');
    projects.option('-g, --group <groups...>', 'Filter projects by group');
    projects.option('-n, --name <names...>', 'Filter projects by name');
    projects
        .command('check')
        .description('Check state of projects')
        .action(buildRunner());
    projects
        .command('install')
        .description('Install all projects to this monorepo')
        .action(buildRunner());
    projects
        .command('sync')
        .description('Checkout all projects to the appropriate ref/branch')
        .action(buildRunner());
    projects
        .command('run')
        .description('Run script or command in all projects')
        .option('-s', '--script <script>', 'Script to run')
        .action(buildRunner());
    projects
        .command('setup')
        .description('Run setup script in all projects')
        .action(buildRunner());
    projects
        .command('uninstall')
        .description('Uninstall projects in this monorepo')
        .action(buildRunner());
    projects
        .command('reinstall')
        .description('Reinstall projects in this monorepo')
        .action(buildRunner());
    return projects;
}
function buildRunner() {
    return async function () {
        const cmd = this;
        await context_1.default.current.runCommandForProjects(cmd);
    };
}
//# sourceMappingURL=projects.js.map