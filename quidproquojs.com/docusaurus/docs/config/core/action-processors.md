---
title: defineActionProcessors
description: Register a service's custom or overriding action processors — the runtime implementations that execute yielded actions.
---

# defineActionProcessors

Defines a source of **action processors** for a service. Stories yield actions; action processors are the runtime functions that actually execute them (talk to S3, DynamoDB, an API, etc.). `defineActionProcessors` points at a module that returns a map of processors, which the runtime merges into the service's processor list — the mechanism for **registering custom actions** or **overriding** the built-in processor for an existing action type. This is an advanced extension point; most services never need it.

- **On AWS:** no infrastructure of its own. The referenced module is bundled as a build source and loaded inside the service's existing Lambdas at runtime; there is no separate construct or resource.

```typescript
import { defineActionProcessors } from '@qpqjs/core';

export default [
  defineActionProcessors('/entry/actionProcessors/getCustomProcessors::getCustomProcessors'),
];
```

## Signature

```typescript
function defineActionProcessors(
  getActionProcessors: QpqFunctionRuntime,
): ActionProcessorsQPQConfigSetting;
```

## Parameters

### `getActionProcessors` — `QpqFunctionRuntime` (required)

A reference (usually a relative path string of the form `'/path/to/file::exportedFunctionName'`) to a module whose export is an `ActionProcessorListResolver` — an async function called with the resolved config and a dynamic module loader that returns an **action processor list**: a map from action type to its processor function.

```typescript
// getCustomProcessors.ts
import { ActionProcessorListResolver, actionResult } from '@qpqjs/core';

export const getCustomProcessors: ActionProcessorListResolver = async (qpqConfig, dynamicModuleLoader) => ({
  ['MyDomain.DoThing']: async (payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    // execute the action, then wrap the outcome with actionResult / actionResultError
    return actionResult({ ok: true });
  },
});
```

Each key is an **action type**; each value is the processor that runs when a story yields an action of that type. Because the runtime merges all processor sources into a single map (later sources spread over earlier ones), a source that provides a key matching a built-in action type **overrides** the built-in processor, and a source that provides a new key **registers a custom action**. You can declare `defineActionProcessors` more than once — every declared source is loaded and merged. Each source's `uniqueKey` is derived from its runtime reference.

## Returning results from a processor

A processor never returns a bare value or throws to the story. It returns an `ActionProcessorResult`, built with helpers from `@qpqjs/core`:

- `actionResult(value)` wraps a successful result. The story receives `value` from its `yield`.
- `actionResultError(errorType, errorText, errorStack?)` wraps a failure. `errorType` should come from the action's own error enum. By default the failure ends the story with that `QPQError`; a story that yields the action with `returnErrors` set receives it as an `EitherActionResult` instead.
- `actionResultErrorFromCaughtError(caughtError, errorMap)` converts a caught exception inside a `try`/`catch`. The map is keyed by the error's runtime `code` (Node fs style: `ENOENT`, `EACCES`) first, then its `name` (AWS SDK style: `NoSuchBucket`, `AccessDenied`); the matching entry builds the `actionResultError`. An unmapped error becomes a `GenericError` whose text names only the unmapped key, never the raw error message, so map every error your processor can realistically hit.

```typescript
import { actionResult, actionResultError, actionResultErrorFromCaughtError, ErrorTypeEnum } from '@qpqjs/core';

try {
  const item = await readTheThing(payload.id);
  return actionResult(item);
} catch (error) {
  return actionResultErrorFromCaughtError(error, {
    ENOENT: () => actionResultError(ErrorTypeEnum.NotFound, `Thing not found [${payload.id}]`),
  });
}
```

## Notes

- The resolver is invoked with the service's `QPQConfig` and a `dynamicModuleLoader`, so it can build processors that depend on config or lazily load further modules.
- A custom action typically pairs with a custom action **requester** (an `ask*` generator) that yields the matching action type, so stories can compose it like any built-in action.

## Examples

```typescript
import { defineActionProcessors } from '@qpqjs/core';

export default [
  // Register custom actions and/or override built-in processors
  defineActionProcessors('/entry/actionProcessors/getCustomProcessors::getCustomProcessors'),
];
```

## Related

- **AWS implementation:** no dedicated construct — the resolver module is bundled and loaded inside the service's Lambdas at runtime.
