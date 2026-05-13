"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
class Project {
    constructor(context, config) {
        this.context = context;
        this.key = config.key;
        Object.assign(this, config);
        this.name || (this.name = this.key);
        this.path || (this.path = "/");
        this.ref || (this.ref = "main");
        if (!this.path.endsWith("/")) {
            this.path = this.path + "/";
        }
    }
    get relativeInstallPath() {
        return `${this.path}${this.key}`;
    }
    get installPath() {
        return `${this.context.rootPath}/${this.relativeInstallPath}`;
    }
    get installParentPath() {
        return path_1.default.dirname(this.installPath);
    }
    get repositoryURL() {
        if (this.repository?.includes("://")) {
            // full url already defined
            return this.repository;
        }
        if (this.context.getSetting('git_protocol') == 'ssh') {
            // use ssh URL
            return `git@github.com:${this.repository}.git`;
        }
        else {
            // use https url
            return `https://github.com/${this.repository}.git`;
        }
    }
    isInstalled() {
        return fs_1.default.existsSync(this.installPath);
    }
    hasAnyGroups(groups) {
        return this.groups && this.groups.some(group => groups.includes(group));
    }
    async isRemoteAccessible() {
        try {
            const ctx = this.context;
            // check if can call ls-remote on remote repository
            await this.context.execIn(ctx.rootPath, `GIT_TERMINAL_PROMPT=0 git ls-remote --heads ${this.repositoryURL} HEAD`, { suppressOutput: true, suppressErrors: true });
            return true;
        }
        catch (e) {
            return false;
        }
    }
    check() {
        const ctx = this.context;
        console.log(`Checking ${this.name} at ${this.relativeInstallPath}`);
        const status = this.isInstalled()
            ? chalk_1.default.green("installed")
            : chalk_1.default.red("not installed");
        ctx.log(`Status: ${status}`, { style: "detail" });
    }
    async install() {
        const ctx = this.context;
        console.log(`Installing ${this.name} to ${this.relativeInstallPath}`);
        // skip if installed
        if (this.isInstalled()) {
            ctx.log("Already installed, skipping", { style: "detail" });
            return;
        }
        // skip if inaccessible
        if (!(await this.isRemoteAccessible())) {
            ctx.log("Remote repository inaccessible, skipping", { style: "detail" });
            return;
        }
        // prepare directory
        fs_1.default.mkdirSync(this.installParentPath, { recursive: true });
        // clone
        const cmd = `git clone ${this.repositoryURL} ${this.relativeInstallPath}`;
        await ctx.execIn(ctx.rootPath, cmd);
        ctx.log("Installed", { style: "detail" });
        // add to git ignore
        if (ctx.ensureGitIgnored(this.relativeInstallPath)) {
            ctx.log("Added to .gitignore", { style: "detail" });
        }
        // sync to ref
        await ctx.execIn(this.relativeInstallPath, `git checkout ${this.ref}`);
        ctx.log(`Ref: ${this.ref} checked out`, { style: "detail" });
    }
    async uninstall() {
        const ctx = this.context;
        console.log(`Uninstalling ${this.name} at ${this.relativeInstallPath}`);
        if (!this.isInstalled()) {
            ctx.log("Already uninstalled, skipping", { style: "detail" });
            return;
        }
        // remove
        fs_1.default.rmSync(this.installPath, { recursive: true, force: true });
        ctx.log("Uninstalled", { style: "detail" });
    }
    async reinstall() {
        await this.uninstall();
        await this.install();
    }
    async sync(options = {}) {
        const ctx = this.context;
        console.log(`Syncing ${this.name}`);
        if (!this.isInstalled()) {
            ctx.log("Not installed, skipping", { style: "detail" });
            return;
        }
        let targetRef = this.ref;
        if (options.matchCurrent) {
            const { stdout } = await ctx.execIn(ctx.rootPath, `git rev-parse --abbrev-ref HEAD`, { suppressOutput: true });
            const hostBranch = stdout.trim();
            if (hostBranch && hostBranch !== 'HEAD' && await this.hasRef(hostBranch)) {
                targetRef = hostBranch;
                ctx.log(`Matching host branch: ${hostBranch}`, { style: "detail" });
            }
            else if (hostBranch) {
                ctx.log(`Host branch ${hostBranch} not found in project, using ${this.ref}`, { style: "detail" });
            }
        }
        // checkout ref
        await ctx.execIn(this.relativeInstallPath, `git pull`, { suppressOutput: true });
        ctx.log(`Up-to-date`, { style: "detail" });
        await ctx.execIn(this.relativeInstallPath, `git checkout ${targetRef}`, { suppressOutput: true });
        ctx.log(`Ref: ${targetRef} checked out`, { style: "detail" });
    }
    async hasRef(ref) {
        const ctx = this.context;
        try {
            await ctx.execIn(this.relativeInstallPath, `git rev-parse --verify --quiet ${ref}`, { suppressOutput: true, suppressErrors: true });
            return true;
        }
        catch { }
        try {
            const { stdout } = await ctx.execIn(this.relativeInstallPath, `git ls-remote --heads --tags origin ${ref}`, { suppressOutput: true, suppressErrors: true });
            return stdout.trim().length > 0;
        }
        catch {
            return false;
        }
    }
    async run(options) {
        const ctx = this.context;
        const script = options.script;
        const script_path = `${this.installPath}/${script}`;
        ctx.log(`Running ${script} for ${this.name}`);
        if (!this.isInstalled()) {
            ctx.log("Not installed, skipping", { style: "detail" });
            return;
        }
        // Ensure script present
        if (fs_1.default.existsSync(script_path)) {
            await ctx.execIn(this.relativeInstallPath, `./${script}`);
        }
        else {
            ctx.log(`Script ${script} not found for ${this.name}`, { style: "detail" });
        }
    }
    async setup() {
        await this.run({ script: "setup.sh" });
    }
}
exports.default = Project;
module.exports = Project;
//# sourceMappingURL=project.js.map