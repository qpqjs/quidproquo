---
title: askUserScriptBuild
description: Build a user script project that is already on a storage drive into one JavaScript file, on whichever runtime is calling.
---

# askUserScriptBuild

Builds a user script project that is already stored on a drive into one file at `outputFilepath`. Nothing else is written. That file is what [askUserScriptExecute](./ask-user-script-execute.md) is then pointed at.

- **Action type:** `UserScriptActionType.Build`

```typescript
import { askUserScriptBuild, askUserScriptExecute } from '@qpqjs/core';

export function* askBuildAndRunReport(drive: string) {
  const { exports } = yield* askUserScriptBuild(drive, 'scripts/report/source', 'scripts/report/main.js');

  return yield* askUserScriptExecute(drive, 'scripts/report/main.js', 'buildReport', 2026);
}
```

## Signature

```typescript
function* askUserScriptBuild(
  drive: string,
  sourceDirectory: string,
  outputFilepath: string,
  scope?: string,
  options?: UserScriptBuildOptions,
): AskResponse<UserScriptBuildOutcome>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive holding the project and receiving the output. |
| `sourceDirectory` | `string` | Directory holding the project: `src/main.ts` and whatever it imports. |
| `outputFilepath` | `string` | The exact file the built JavaScript is written to. Any path works, including an event doc asset path with no extension. |
| `scope` | `string` (optional) | Storage scope, a single path segment. |
| `options.sourceMap` | `boolean` (optional) | Embed a source map in the output file. Off by default. A separate `.map` file is never written. |

## Returns

`UserScriptBuildOutcome`: `{ exports: string[] }`, the export names of the built module.

## Errors

`askUserScriptBuild` exposes its catalog as `askUserScriptBuild.errorType`:

| Error | Cause |
| --- | --- |
| `SourceNotFound` | There is no `src/main.ts` or `src/main.js` under the source directory. |
| `SourceTooLarge` | More than 200 files, more than 2MB, or a `node_modules` folder in the source. |
| `BuildFailed` | The bundler reported errors, including a refused import. |
| `OutputNotSingleFile` | The build emitted anything besides the one output file. |
| `NoExports` | The built module exports nothing. |
| `NonFunctionExport` | An export of the built module is not a function. |

The last two, and `BuildFailed` for a built file that does not load, come from checking the published file inside the sandbox with [askUserScriptListExports](./ask-user-script-list-exports.md); a runner failure there (`RunnerUnavailable`, `TimedOut`) passes through with that action's type. The build never loads the script in the host.
| `DriveNotFound` | The storage drive does not exist. |
| `InvalidScope` | The scope is not a valid single path segment, or the drive refuses it. |

## Notes

- Only services that opt in can process this action. Call `defineUserScriptBuilder()` from `@qpqjs/user-script` in the service config; services that do not call it never load rspack.
- On lambda the service also needs rspack from a layer. Pass `getUserScriptBuilderApiLayer()` in its api layers and produce the layer with `qpq script:builder-layer` (`--arch x86_64` for x86 lambdas; the default is arm64), normally from the app's `qpq:predeploy` hook.
- A script project may import `@qpqjs/core` and its own files. Other npm packages and Node builtins are refused.

## Related

- [askUserScriptBuildFromZip](./ask-user-script-build-from-zip.md) to build from a single zip file instead of a directory.
- [askUserScriptExecute](./ask-user-script-execute.md) to call a function from the built script.
