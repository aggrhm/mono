"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const context_1 = __importDefault(require("./lib/context"));
const projects_1 = __importDefault(require("./commands/projects"));
const package_json_1 = __importDefault(require("../package.json"));
exports.run = (cwd, argv) => {
    const program = new commander_1.Command();
    context_1.default.current = new context_1.default(cwd);
    context_1.default.current.log(`Running mono in ${cwd}`, { style: 'muted' });
    program
        .name("mono")
        .description("Manage a monorepo without all the pain.")
        .version(package_json_1.default.version);
    program.addCommand((0, projects_1.default)());
    program.parse(argv);
};
//# sourceMappingURL=index.js.map