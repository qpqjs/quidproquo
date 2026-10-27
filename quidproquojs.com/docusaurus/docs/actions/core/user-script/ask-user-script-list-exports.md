---
title: askUserScriptListExports
description: Load a built user script inside the sandbox and report its exports without calling any.
---

# askUserScriptListExports

Loads a built script inside the service's sandbox ([defineUserScriptRunner](../../../config/core/user-script-runner.md)) and reports its own exports, split into functions and other values, without calling any of them. [askUserScriptBuild](./ask-user-script-build.md) and [askUserScriptBuildFromZip](./ask-user-script-build-from-zip.md) use it to check the output contract after publishing, so a script's top-level code never runs in the host.

- **Action type:** `UserScriptActionType.ListExports`

```typescript
import { askUserScriptListExports } from '@qpqjs/core';

export function* askScriptExportNames(drive: string, filepath: string) {
  const { functions } = yield* askUserScriptListExports(drive, filepath);
  return functions;
}
```

## Signature

```typescript
function* askUserScriptListExports(drive: string, filepath: string, scope?: string): AskResponse<UserScriptModuleExports>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive the built script is on. |
| `filepath` | `string` | The built script file on the drive. |
| `scope` | `string` | Optional storage scope the file lives under. |

## Returns

`UserScriptModuleExports`: `{ functions: string[], nonFunctions: string[] }`, the module's own enumerable exports in definition order.

## Errors

| Error | Cause |
| --- | --- |
| `ScriptNotFound` | There is no file at `filepath`. |
| `InvalidScope` | The scope is not a valid single path segment, or the drive refuses it. |
| `ModuleNotFound` | The script required a module outside the shared package list. |
| `ScriptInvalid` | The script threw while its module body was being loaded. |
| `RunnerUnavailable` | The service declares no runner, or the runner could not be invoked. |
| `TimedOut` | The runner did not finish within the service's configured runner timeout. |

## Related

- [askUserScriptExecute](./ask-user-script-execute.md) to call one of the exports.
- [defineUserScriptRunner](../../../config/core/user-script-runner.md) for the sandbox this runs in.
