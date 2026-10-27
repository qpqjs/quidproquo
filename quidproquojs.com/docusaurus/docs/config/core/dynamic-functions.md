---
title: defineDynamicFunctions
description: Register a module's exported object of functions as a named dynamic-functions surface that other stories can invoke by member name with askDynamicFunctionExecute.
---

# defineDynamicFunctions

Registers a module export — an **object whose properties are functions** — under a name, so any story can invoke one of its members by name with [askDynamicFunctionExecute](../../actions/core/dynamic-functions/ask-dynamic-function-execute.md) without a per-function registration. It is the successor to [defineInlineFunction](./inline-function.md): one setting addresses a whole surface (name + member) instead of one function per entry.

- **On AWS:** deploys **no dedicated infrastructure** of its own. The referenced module is loaded and its member is invoked inside whatever Lambda is already running the calling story, sharing its action processors and session context. Registration simply makes the surface resolvable by name.

```typescript
import { defineDynamicFunctions } from '@qpqjs/core';

export default [
  defineDynamicFunctions('templateEventDoc', '/entry/eventDocs::templateEventDoc'),
];
```

## Signature

```typescript
function defineDynamicFunctions(
  dynamicFunctionsName: string,
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedDynamicFunctionsSettings,
): DynamicFunctionsQPQConfigSetting;
```

## Parameters

### `dynamicFunctionsName` — `string` (required)

The name callers pass to [askDynamicFunctionExecute](../../actions/core/dynamic-functions/ask-dynamic-function-execute.md). This is the config's `uniqueKey`.

### `runtime` — `QpqFunctionRuntime` (required)

A reference to the module to register, usually a relative path string of the form `'/path/to/file::exportedObjectName'`. The exported value must be an object whose own enumerable properties are functions — that object's members are the callable surface.

### `options` — `QPQConfigAdvancedDynamicFunctionsSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `owner` | `CrossModuleOwner<'dynamicFunctionsName'>` | – | Declares that the functions object is owned by **another** module/service, so it can be resolved/invoked across modules. `{ module, application, feature, environment, dynamicFunctionsName }` — all optional; unset parts default to the current service. |
| `deprecated` | `boolean` | `false` | Marks the setting as deprecated in the config. |

## Examples

```typescript
import { defineDynamicFunctions } from '@qpqjs/core';

export default [
  defineDynamicFunctions('templateEventDoc', '/entry/eventDocs::templateEventDoc'),

  // Owned by another module
  defineDynamicFunctions('billingHelpers', '/entry/functions/billing::billingHelpers', {
    owner: { module: 'billing' },
  }),
];
```

## Related

- [askDynamicFunctionExecute](../../actions/core/dynamic-functions/ask-dynamic-function-execute.md) — invokes a member of a registered dynamic-functions object by name and returns its result.
- [defineInlineFunction](./inline-function.md) — registers a single story as a callable function; use this instead when the surface is one exported object with several members.
