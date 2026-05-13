import Context from './context';
type ProjectConfig = {
    key: string;
    name: string;
    path: string;
    repository: string;
    ref: string;
    groups: string[];
};
export default class Project {
    context: Context;
    key: string;
    name: string;
    path: string;
    repository: string | undefined;
    groups: string[] | undefined;
    ref: string;
    dependencies: string[] | undefined;
    constructor(context: Context, config: ProjectConfig);
    get relativeInstallPath(): string;
    get installPath(): string;
    get installParentPath(): string;
    get repositoryURL(): string;
    isInstalled(): boolean;
    hasAnyGroups(groups: string[]): boolean | undefined;
    isRemoteAccessible(): Promise<boolean>;
    check(): void;
    install(): Promise<void>;
    uninstall(): Promise<void>;
    reinstall(): Promise<void>;
    sync(options?: {
        matchCurrent?: boolean;
    }): Promise<void>;
    private hasRef;
    run(options: {
        script: string;
    }): Promise<void>;
    setup(): Promise<void>;
}
export {};
