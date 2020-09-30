namespace ts.tscWatch {
    describe("unittests:: tsc-watch:: forceConsistentCasingInFileNames", () => {
        const loggerFile: File = {
            path: `${projectRoot}/logger.ts`,
            content: `export class logger { }`
        };
        const anotherFile: File = {
            path: `${projectRoot}/another.ts`,
            content: `import { logger } from "./logger"; new logger();`
        };
        const tsconfig: File = {
            path: `${projectRoot}/tsconfig.json`,
            content: JSON.stringify({
                compilerOptions: { forceConsistentCasingInFileNames: true }
            })
        };

        function verifyConsistentFileNames({ subScenario, changes }: { subScenario: string; changes: TscWatchCompileChange[]; }) {
            verifyTscWatch({
                scenario: "forceConsistentCasingInFileNames",
                subScenario,
                commandLineArgs: ["--w", "--p", tsconfig.path],
                sys: () => createWatchedSystem([loggerFile, anotherFile, tsconfig, libFile, tsconfig]),
                changes
            });
        }

        verifyConsistentFileNames({
            subScenario: "when changing module name with different casing",
            changes: [
                {
                    caption: "Change module name from logger to Logger",
                    change: sys => sys.writeFile(anotherFile.path, anotherFile.content.replace("./logger", "./Logger")),
                    timeouts: runQueuedTimeoutCallbacks,
                }
            ]
        });

        verifyConsistentFileNames({
            subScenario: "when renaming file with different casing",
            changes: [
                {
                    caption: "Change name of file from logger to Logger",
                    change: sys => sys.renameFile(loggerFile.path, `${projectRoot}/Logger.ts`),
                    timeouts: runQueuedTimeoutCallbacks,
                }
            ]
        });

        verifyTscWatch({
            scenario: "forceConsistentCasingInFileNames",
            subScenario: "when relative information file location changes",
            commandLineArgs: ["--w", "--p", ".", "--explainFiles"],
            sys: () => {
                const moduleA: File = {
                    path: `${projectRoot}/moduleA.ts`,
                    content: `import a = require("./ModuleC")`
                };
                const moduleB: File = {
                    path: `${projectRoot}/moduleB.ts`,
                    content: `import a = require("./moduleC")`
                };
                const moduleC: File = {
                    path: `${projectRoot}/moduleC.ts`,
                    content: `export const x = 10;`
                };
                const tsconfig: File = {
                    path: `${projectRoot}/tsconfig.json`,
                    content: JSON.stringify({ compilerOptions: { forceConsistentCasingInFileNames: true } })
                };
                return createWatchedSystem([moduleA, moduleB, moduleC, libFile, tsconfig], { currentDirectory: projectRoot });
            },
            changes: [
                {
                    caption: "Prepend a line to moduleA",
                    change: sys => sys.prependFile(`${projectRoot}/moduleA.ts`, `// some comment
                    `),
                    timeouts: runQueuedTimeoutCallbacks,
                }
            ],
        });
    });
}
