---
title: defineInlineFunction
description: Register a story as a named inline function that other stories can invoke by name with askInlineFunctionExecute.
---

# defineInlineFunction

Registers a story runtime as a named **inline function**. Once registered, any story can invoke it by name with [askInlineFunctionExecute](../../actions/core/inline-function/ask-inline-function-execute.md) and receive its return value. Inline functions run **in-process** inside the same runtime as the caller (as a nested story, one level deeper) — they are a way to name and reuse a story as a callable unit, not a separate deployed service.

- **On AWS:** deploys **no dedicated infrastructure** of its own. The referenced story is loaded and executed inside whatever Lambda is already running the calling story, sharing its action processors and session context. Registration simply makes the runtime resolvable by name.

```typescript
import { defineInlineFunction } from '@qpqjs/core';

export default [
  defineInlineFunction('/entry/functions/calculateTax::calculateTax'),
];
```

## Signature

```typescript
function defineInlineFunction(
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedInlineFunctionSettings,
): InlineFunctionQPQConfigSetting;
```

## Parameters

### `runtime` — `QpqFunctionRuntime` (required)

A reference to the story to register, usually a relative path string of the form `'/path/to/file::exportedFunctionName'`. This is the story that runs when the inline function is executed.

### `options` — `QPQConfigAdvancedInlineFunctionSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `functionName` | `string` | derived from `runtime` | The name callers pass to [askInlineFunctionExecute](../../actions/core/inline-function/ask-inline-function-execute.md). If omitted, it is derived from the runtime reference (the story's exported name). This is the config's `uniqueKey`. |
| `owner` | `CrossModuleOwner<'functionName'>` | – | Declares that the function is owned by **another** module/service, so it can be resolved/invoked across modules. `{ module, application, feature, environment, functionName }` — all optional; unset parts default to the current service. |
| `deprecated` | `boolean` | `false` | Marks the function as deprecated in the config. |

## Examples

```typescript
import { defineInlineFunction } from '@qpqjs/core';

export default [
  // Name derived from the story export ('calculateTax')
  defineInlineFunction('/entry/functions/calculateTax::calculateTax'),

  // Explicit name
  defineInlineFunction('/entry/functions/pricing::run', {
    functionName: 'computePricing',
  }),
];
```

## Related

- [askInlineFunctionExecute](../../actions/core/inline-function/ask-inline-function-execute.md) — invokes a registered inline function by name and returns its result.
