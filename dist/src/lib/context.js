"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yaml_1 = __importDefault(require("yaml"));
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const chalk_1 = __importDefault(require("chalk"));
const project_1 = __importDefault(require("./project"));
const exec = util_1.default.promisify(require("child_process").exec);
class Context {
    constructor(cwd) {
        this.rootPath = cwd;
        this.load();
    }
    get settings() {
        return this.config?.settings;
    }
    get hostType() {
        if (process.env.CODESPACES == 'true') {
            return 'codespace';
        }
        else if (process.env.REMOTE_CONTAINERS == 'true') {
            return 'remote_container';
        }
        else {
            return 'local';
        }
    }
    get hasGithubToken() {
        return (!!process.env.GITHUB_TOKEN);
    }
    get envKeyPrefix() {
        if (this.config?.env_key_prefix) {
            return this.config?.env_key_prefix;
        }
        else {
            return `${this.config?.name.toUpperCase()}_`;
        }
    }
    load() {
        var _a, _b, _c, _d;
        // load yaml file
        const path = this.rootPath + "/mono.yml";
        const contents = fs_1.default.readFileSync(path, "utf8");
        this.config = yaml_1.default.parse(contents);
        // establish defaults
        (_a = this.config).settings || (_a.settings = {});
        (_b = this.config).projects || (_b.projects = {});
        (_c = this.config).files || (_c.files = []);
        (_d = this.config.settings).git_protocol || (_d.git_protocol = 'https');
        return this.config;
    }
    getSetting(key) {
        // check env var first
        const env_key = `MONO_${key.toUpperCase()}`;
        if (process.env[env_key]) {
            return process.env[env_key];
        }
        else {
            return this.config?.settings[key];
        }
    }
    getProjects() {
        return Object.entries(this.config?.projects || []).map(([key, conf]) => {
            return new project_1.default(this, { ...conf, key: key });
        });
    }
    getProjectsMap() {
        return this.getProjects().reduce((memo, project) => {
            memo[project.key] = project;
            return memo;
        }, {});
    }
    findProjects({ withNames, withGroups }) {
        // find all projects with either these names or groups
        const filteredProjects = this.getProjects().filter((p) => {
            if (withNames && withNames.includes(p.key)) {
                return true;
            }
            if (withGroups && p.hasAnyGroups(withGroups)) {
                return true;
            }
            return false;
        });
        return filteredProjects;
    }
    expandProjectDependencies(projects) {
        let projectMap = this.getProjectsMap();
        function getDeps(keys) {
            return keys.map((key) => {
                const deps = projectMap[key].dependencies || [];
                //return [key].concat(getDeps(deps))
                return getDeps(deps).concat([key]);
            });
        }
        const initialKeys = projects.map((p) => p.key);
        const allKeys = new Set(getDeps(initialKeys).flat(Infinity));
        return Array.from(allKeys).map((key) => projectMap[key]);
    }
    async runCommandForProjects(cmd) {
        // find projects that matter
        const action = cmd.name();
        const selectedNames = cmd.parent.opts().name;
        const selectedGroups = cmd.parent.opts().group;
        const selectedFlex = cmd.args;
        const options = cmd.options;
        let projects = [];
        if (selectedNames) {
            projects = this.findProjects({ withNames: selectedNames });
        }
        else if (selectedGroups) {
            projects = this.findProjects({ withGroups: selectedGroups });
        }
        else if (selectedFlex.length > 0) {
            projects = this.findProjects({ withNames: selectedFlex, withGroups: selectedFlex });
        }
        else {
            projects = this.getProjects();
        }
        projects = this.expandProjectDependencies(projects);
        this.log(`Performing [${action}] for ${projects.length} project(s).`, { style: "info" });
        for (const project of projects) {
            await project[action](options);
        }
    }
    async execIn(path, cmd, options = {}) {
        try {
            const fullCmd = `cd ${path} && ${cmd}`;
            const promise = exec(fullCmd);
            const child = promise.child;
            if (!options.suppressOutput) {
                child.stdout.pipe(process.stdout);
            }
            if (!options.suppressErrors) {
                child.stderr.pipe(process.stderr);
            }
            const { stdout, stderr } = await promise;
        }
        catch (e) {
            throw e;
        }
    }
    log(msg, options = {}) {
        switch (options.style) {
            case "muted":
                msg = chalk_1.default.grey.bold(msg);
                break;
            case "info":
                msg = chalk_1.default.blue(msg);
                break;
            case "detail":
                msg = chalk_1.default.grey("└─ ") + msg;
                break;
        }
        console.log(msg);
    }
    envKey(key) {
        return `${this.envKeyPrefix}${key.toUpperCase()}`;
    }
    ensureGitIgnored(path) {
        // check if present
        const ignorePath = this.rootPath + "/.gitignore";
        const contents = fs_1.default.readFileSync(ignorePath);
        if (!contents.includes(path)) {
            fs_1.default.appendFileSync(ignorePath, `\n${path}`);
            return true;
        }
        return false;
    }
}
exports.default = Context;
//# sourceMappingURL=context.js.map