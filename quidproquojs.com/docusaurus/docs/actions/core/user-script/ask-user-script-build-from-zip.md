---
title: askUserScriptBuildFromZip
description: Build a user script project stored as one zip file on a storage drive into a single main.js, on whichever runtime is calling.
---

# askUserScriptBuildFromZip

Builds a user script project that is stored on a drive as a single zip file into `<outputDirectory>/main.js` (plus `main.js.map`). The same contract, limits and output as [askUserScriptBuild](./ask-user-script-build.md); only the source arrives as an archive instead of loose files. The output is what [askUserScriptExecute](./ask-user-script-execute.md) is then pointed at.

- **Action type:** `UserScriptActionType.BuildFromZip`

```typescript
import { askUserScriptBuildFromZip, askUserScriptExecute } from 'quidproquo-core';

export function* askBuildAndRunUploadedScript(drive: string, docId: string, assetId: string, scope: string) {
  const { exports } = yield* askUserScriptBuildFromZip(drive, `${docId}/assets/${assetId}`, `${docId}/built`, scope);

  return yield* askUserScriptExecute(drive, `${docId}/built`, exports[0], [], scope);
}
```

## Signature

```typescript
function* askUserScriptBuildFromZip(
  drive: string,
  zipFilepath: string,
  outputDirectory: string,
  scope?: string,
): AskResponse<UserScriptBuildOutcome>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive holding the zip and receiving the output. |
| `zipFilepath` | `string` | Path of the zip file on the drive. |
| `outputDirectory` | `string` | Directory that receives `main.js` and `main.js.map`. |
| `scope` | `string` (optional) | Storage scope, a single path segment, applied to the read and the writes. |

## Zip layout

The zip holds the project files: `src/main.ts` (or `src/main.js`) and whatever it imports, with whatever else the project has (`package.json`, a README). Two layouts are accepted:

- **At the root:** `src/main.ts`, `src/helpers/x.ts`, `package.json`.
- **Wrapped in one folder**, the way most tools zip a directory: `my-script/src/main.ts`, `my-script/src/helpers/x.ts`. The folder is stripped when every entry is inside the same single top-level folder and nothing is under `src/` at the root.

A root `src/` always wins, so a zip holding only `src/...` is never stripped. Directory entries are ignored; folders come from file paths.

## Returns

`UserScriptBuildOutcome`: `{ exports: string[] }`, the export names of the built module.

## Errors

`askUserScriptBuildFromZip` exposes its catalog as `askUserScriptBuildFromZip.errorType`:

| Error | Cause |
| --- | --- |
| `SourceNotFound` | There is no file at `zipFilepath`, or no `src/main.ts` or `src/main.js` inside the zip. |
| `SourceTooLarge` | The zip file is over 2MB, it holds more than 200 files, it unpacks to more than 2MB, or it contains a `node_modules` folder. |
| `InvalidArchive` | The file is not a zip this runtime can read, or an entry is encrypted or corrupt (including a size claim that does not match the data). |
| `UnsafeArchiveEntry` | An entry path is absolute, contains `..` or an empty segment, uses backslashes, or the entry is a symlink. |
| `BuildFailed` | The bundler reported errors, including a refused import. |
| `OutputNotSingleFile` | The build emitted more than one JavaScript file. |
| `NoExports` | The built module exports nothing. |
| `NonFunctionExport` | An export of the built module is not a function. |
| `DriveNotFound` | The storage drive does not exist. |
| `InvalidScope` | The scope is not a valid single path segment, or the drive refuses it. |

## Notes

- The zip is treated as untrusted. Unpacked bytes are counted as they are written and the build stops the moment a limit is crossed; the sizes in the zip's own headers are never trusted.
- Registered by the same `defineUserScriptBuilder()` as `askUserScriptBuild`: a service that registers the builder gets both actions, and needs the same rspack layer on lambda.
- A script project may import `quidproquo-core` and its own files. Other npm packages and Node builtins are refused.

## Related

- [askUserScriptBuild](./ask-user-script-build.md) to build from loose files in a drive directory.
- [askUserScriptExecute](./ask-user-script-execute.md) to call a function from the built script.
