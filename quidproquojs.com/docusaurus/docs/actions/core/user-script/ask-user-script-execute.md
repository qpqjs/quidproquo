---
title: askUserScriptExecute
description: Call one exported function of a hand-written script stored on a storage drive, driving generator members as a nested story.
---

# askUserScriptExecute

Calls one exported function of a user script stored on a storage drive. A script is a directory whose `main.js` is a CommonJS module that exports functions. The named member runs with the same contract as a [dynamic functions](../dynamic-functions/ask-dynamic-function-execute.md) member: a **generator member** is driven through the runtime as a nested story, sharing the caller's action processors and session context, and a **promise-returning member** is awaited.

- **Action type:** `UserScriptActionType.Execute`

```typescript
import { askUserScriptExecute } from 'quidproquo-core';

import { ScriptFunctions } from '../types/ScriptFunctions';

export function* askRunReport(drive: string) {
  return yield* askUserScriptExecute<ScriptFunctions>(drive, 'scripts/report', 'buildReport', 2026);
}
```

## Signature

```typescript
function* askUserScriptExecute<TFunctions extends DynamicFunctions, TName extends keyof TFunctions & string>(
  drive: string,
  directory: string,
  functionName: TName,
  ...args: Parameters<TFunctions[TName]>
): AskResponse<DynamicFunctionResult<TFunctions[TName]>>;
```

Pass the script's functions type as `TFunctions` so `functionName` and `args` are checked and the return type is inferred.

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive the script is stored on. |
| `directory` | `string` | The script directory on the drive. The entry is always `<directory>/main.js`. |
| `functionName` | `TName` | Name of the exported member to call. |
| `args` | `Parameters<TFunctions[TName]>` | Positional arguments passed to the member. |

## Returns

`DynamicFunctionResult<TFunctions[TName]>`: the story return value for a generator member, the awaited value for a promise-returning member, or the plain return value otherwise.

## Errors

`askUserScriptExecute` exposes its catalog as `askUserScriptExecute.errorType`:

| Error | Cause |
| --- | --- |
| `ScriptNotFound` | There is no `main.js` in the script directory. |
| `InvalidScope` | The scope is not a valid single path segment, or the drive refuses it. |
| `InvalidStorageClass` | The entry is in cold storage and cannot be read. |
| `ModuleNotFound` | The script required a module outside the shared package list. |
| `ScriptInvalid` | The script threw while its module body was being loaded. |
| `FunctionNotFound` | The named export is not an own enumerable function of the module. |
| `FunctionThrew` | The function threw before returning a story, or its promise rejected. |

If the member is a generator and its own story throws, that error propagates with its original error type.

## Notes

- There is no sandbox. The script runs in-process with the caller's permissions, so only store scripts from trusted authors.
- Scripts are plain CommonJS and can only `require` the shared framework packages.
- Actions yielded by the script run through the calling runtime's processors.
- `createUserScriptCaller<TFunctions>(drive, directory)` wraps this action in a typed proxy: `yield* caller.buildReport(2026)` yields the same action as calling `askUserScriptExecute` directly.

## Related

- [askDynamicFunctionExecute](../dynamic-functions/ask-dynamic-function-execute.md) for functions registered in config rather than stored on a drive.
