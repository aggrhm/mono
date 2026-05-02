import Project from './project';
import { Command } from 'commander';
type ContextConfig = {
    name: string;
    env_key_prefix: string;
    settings: Record<string, any>;
    projects: Record<string, any>;
    files: Record<string, any>;
};
export default class Context {
    static current: Context | undefined;
    rootPath: string;
    config: ContextConfig | undefined;
    constructor(cwd: string);
    get settings(): Record<string, any> | undefined;
    get hostType(): "codespace" | "remote_container" | "local";
    get hasGithubToken(): boolean;
    get envKeyPrefix(): string;
    load(): ContextConfig;
    getSetting(key: string): any;
    getProjects(): Project[];
    getProjectsMap(): Record<string, Project>;
    findProjects({ withNames, withGroups }: {
        withNames?: string[];
        withGroups?: string[];
    }): Project[];
    expandProjectDependencies(projects: Project[]): Project[];
    runCommandForProjects(cmd: Command): Promise<void>;
    execIn(path: string, cmd: string, options?: {
        suppressOutput?: boolean;
        suppressErrors?: boolean;
    }): Promise<void>;
    log(msg: string, options?: {
        style?: string;
    }): void;
    envKey(key: string): string;
    ensureGitIgnored(path: string): boolean;
    expandPath(path: string): string;
}
export {};
