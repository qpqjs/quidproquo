# quidproquo-user-script

Builds a user-written script project (`src/main.ts` exporting functions) into one CommonJS `main.js` that `askUserScriptExecute` loads from a storage drive, and runs that build on the platform through `askUserScriptBuild`.

- `buildUserScript({ projectDir, outDir, sourceMap? })`: the build itself, writing `<outDir>/main.js` and nothing else. Source maps are off by default; `sourceMap: true` embeds one in `main.js` rather than writing a `.map` file. Used by `qpq script:build`, by the platform processors, and by anything else that has the project on disk.
- `askUserScriptBuild` and `askUserScriptBuildFromZip` processors: the platform build, from a directory of loose files or from one zip file on a drive. Same limits, same output: exactly one file, written to the `outputFilepath` the caller names (an event doc asset path works), which `askUserScriptExecute` is then pointed at.
- `defineUserScriptBuilder()`: registers both build action processors on a service.
- `getUserScriptBuilderApiLayer(buildPath)`: the lambda layer entry that provides rspack to that service's functions; `qpq script:builder-layer` produces the directory.

Deliberately depends only on core, the node action processors, the config-aws types, rspack, and `yauzl` (a small pure-JavaScript zip reader that streams entries, so unpacked bytes can be capped as they are written), because the processor module is bundled into lambdas.
