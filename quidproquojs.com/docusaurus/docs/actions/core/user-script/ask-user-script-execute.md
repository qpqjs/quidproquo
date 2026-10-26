---
title: askUserScriptExecute
description: Call one exported function of a hand-written script stored on a storage drive, driving generator members as a nested story.
---

# askUserScriptExecute

Calls one exported function of a user script stored on a storage drive. A script is one file, the CommonJS module a [build](./ask-user-script-build.md) wrote, that exports functions. The named member runs with the same contract as a [dynamic functions](../dynamic-functions/ask-dynamic-function-execute.md) member: a **generator member** is driven through the runtime as a nested story, sharing the caller's action processors and session context, and a **promise-returning member** is awaited.

- **Action type:** `UserScriptActionType.Execute`

```typescript
import { askUserScriptExecute } from 'quidproquo-core';

import { ScriptFunctions } from '../types/ScriptFunctions';

export function* askRunReport(drive: string) {
  return yield* askUserScriptExecute<ScriptFunctions>(drive, 'scripts/report/main.js', 'buildReport', 2026);
}
```

## Signature

```typescript
function* askUserScriptExecute<TFunctions extends DynamicFunctions, TName extends keyof TFunctions & string>(
  drive: string,
  filepath: string,
  functionName: TName,
  ...args: Parameters<TFunctions[TName]>
): AskResponse<DynamicFunctionResult<TFunctions[TName]>>;
```

Pass the script's functions type as `TFunctions` so `functionName` and `args` are checked and the return type is inferred.

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive the script is stored on. |
| `filepath` | `string` | The built script file on the drive: the `outputFilepath` a build wrote. Loaded exactly; no `main.js` is assumed. |
| `functionName` | `TName` | Name of the exported member to call. |
| `args` | `Parameters<TFunctions[TName]>` | Positional arguments passed to the member. |

## Returns

`DynamicFunctionResult<TFunctions[TName]>`: the story return value for a generator member, the awaited value for a promise-returning member, or the plain return value otherwise.

## Errors

`askUserScriptExecute` exposes its catalog as `askUserScriptExecute.errorType`:

| Error | Cause |
| --- | --- |
| `ScriptNotFound` | There is no file at `filepath`. |
| `InvalidScope` | The scope is not a valid single path segment, or the drive refuses it. |
| `InvalidStorageClass` | The file is in cold storage and cannot be read. |
| `ModuleNotFound` | The script required a module outside the shared package list. |
| `ScriptInvalid` | The script threw while its module body was being loaded. |
| `FunctionNotFound` | The named export is not an own enumerable function of the module. |
| `FunctionThrew` | The function threw before returning a story, or its promise rejected. |
| `RunnerUnavailable` | The sandboxed runner could not be invoked, or answered with something other than a result. |
| `TimedOut` | The runner did not finish within the timeout set by [defineUserScriptRunner](../../../config/core/user-script-runner.md). |
| `PayloadTooLarge` | The args or the result exceed what can cross to the runner in one invoke. |

If the member is a generator and its own story throws, that error propagates with its original error type.

## Notes

- On AWS, scripts run in the sandbox declared by [defineUserScriptRunner](../../../config/core/user-script-runner.md): a separate function with no resource access and only the pure action processors (date, guid, log, math, error). Inside it, an action that needs a resource fails with "Unable to process action". On the dev server the node processor still runs scripts in-process with the caller's permissions until the dev-server runner lands, so only store scripts from trusted authors.
- Scripts are plain CommonJS and can only `require` the shared framework packages.
- The caller's session crosses to the runner as a cross-service session (decoded token and context, never the raw access token or local context).
- To pass a storage scope, use `askUserScriptExecuteBase(drive, filepath, functionName, args, scope)`: the typed requester spreads the arguments, so it has no place for one.
- A source map embedded by the build is not applied to error stack traces: positions in a thrown error point into the built file, not the original TypeScript.
- `createUserScriptCaller<TFunctions>(drive, filepath)` wraps this action in a typed proxy: `yield* caller.buildReport(2026)` yields the same action as calling `askUserScriptExecute` directly.

## Related

- [askDynamicFunctionExecute](../dynamic-functions/ask-dynamic-function-execute.md) for functions registered in config rather than stored on a drive.
