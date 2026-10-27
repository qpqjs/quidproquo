---
title: askDynamicFunctionExecute
description: Invoke a member of a registered dynamic-functions object by name and return its result, running generator members in-process as a nested story.
---

# askDynamicFunctionExecute

Invokes one member of a [dynamic functions](../../../config/core/dynamic-functions.md) object by name, passing it positional args, and returns whatever the member resolves to. A **plain or async member** is called and (if needed) awaited directly. A **generator member** — the shape of every qpq story — is instead driven through the runtime as a nested story (one depth deeper), sharing the caller's action processors and session context, and its story result is returned.

- **Action type:** `DynamicFunctionsActionType.Execute`

```typescript
import { askDynamicFunctionExecute } from '@qpqjs/core';

import { templateEventDoc } from '../eventDocs/templateEventDoc';

export function* foldTemplate(events: unknown[]) {
  const views = yield* askDynamicFunctionExecute<typeof templateEventDoc>(
    'templateEventDoc',
    'foldSnapshotViews',
    events,
  );

  return views;
}
```

## Signature

```typescript
function* askDynamicFunctionExecute<TFunctions extends DynamicFunctions, TName extends keyof TFunctions & string>(
  dynamicFunctionsName: string,
  functionName: TName,
  ...args: Parameters<TFunctions[TName]>
): AskResponse<DynamicFunctionResult<TFunctions[TName]>>;
```

The `TFunctions` generic is the type of the registered functions object — pass it explicitly (e.g. `askDynamicFunctionExecute<typeof templateEventDoc>(...)`) so `functionName` and `args` are checked against its members and the return type is inferred.

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `dynamicFunctionsName` | `string` | Name of the dynamic functions object to invoke — must match the `dynamicFunctionsName` of a surface registered with [defineDynamicFunctions](../../../config/core/dynamic-functions.md). |
| `functionName` | `TName` | Name of the member to call on the registered object. |
| `args` | `Parameters<TFunctions[TName]>` | Positional arguments passed to the member, typed from `TFunctions`. |

## Returns

`DynamicFunctionResult<TFunctions[TName]>` — the value the member resolves to:

- A **generator** member (a story) resolves to its story return value.
- A **promise-returning** member resolves to its awaited value.
- Any other member resolves to its plain return value.

## Errors

`askDynamicFunctionExecute` fails with `DynamicFunctionsExecuteErrorTypeEnum`:

| Error | Cause |
| --- | --- |
| `DynamicFunctionsNotFound` | No `defineDynamicFunctions` setting is registered under `dynamicFunctionsName`. |
| `ModuleLoadFailed` | The registered module could not be loaded at runtime. |
| `FunctionNotFound` | `functionName` is not an own enumerable function on the loaded object (inherited/prototype members don't count). |
| `FunctionThrew` | A plain or async member threw or rejected. |

If the invoked member is a generator and its own story throws, that error propagates to the caller **with its original error type** (not wrapped in one of the above), with the function name added to the error stack. Catch failures with `askCatch`:

```typescript
const outcome = yield* askCatch(
  askDynamicFunctionExecute<typeof templateEventDoc>('templateEventDoc', 'foldSnapshotViews', events),
);

if (outcome.success) {
  const views = outcome.result;
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Notes

- The invoked member runs **in the same process** as the caller — a generator member runs nested one level deeper, not as a separate deployed service — dynamic functions add no infrastructure of their own.
- `createDynamicFunctionCaller` (also exported from `@qpqjs/core`) wraps this action in a typed proxy so call sites read like a normal method call instead of a string-keyed action: `const caller = createDynamicFunctionCaller<typeof templateEventDoc>('templateEventDoc'); yield* caller.foldSnapshotViews(events);` yields the exact same action as calling `askDynamicFunctionExecute` directly.

## Related

- [defineDynamicFunctions](../../../config/core/dynamic-functions.md) — registers the functions object this action invokes members on.
- [askInlineFunctionExecute](../../core/inline-function/ask-inline-function-execute.md) — the single-function predecessor to this action.
