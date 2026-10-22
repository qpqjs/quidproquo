# quidproquo-user-script

Builds a user-written script project (`src/main.ts` exporting functions) into one CommonJS `main.js` that `askUserScriptExecute` loads from a storage drive, and runs that build on the platform through `askUserScriptBuild`.

- `buildUserScript({ projectDir, outDir })`: the build itself. Used by `qpq script:build`, by the platform processor, and by anything else that has the project on disk.
- `defineUserScriptBuilder()`: registers the build action processor on a service.
- `getUserScriptBuilderApiLayer(buildPath)`: the lambda layer entry that provides rspack to that service's functions; `qpq script:builder-layer` produces the directory.

Deliberately depends only on core, the node action processors, the config-aws types and rspack, because the processor module is bundled into lambdas.
