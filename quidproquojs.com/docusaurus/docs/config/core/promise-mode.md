---
title: definePromiseMode
description: Switch the story-execution engine to a promise-based executor — an advanced, opt-in runtime mode.
---

# definePromiseMode

Switches how the runtime **executes stories** from the default generator-driven engine to a promise-based one. It does this by registering an action-processor override (via `defineActionProcessors`) for the `SystemExecuteStory` action, replacing the default executor with the promisified implementation shipped in @qpqjs/core.

This is an advanced, opt-in mode. In the default mode, each executed story runs through the full instrumented runtime (its own runtime session, correlation, depth tracking, and event history). In promise mode, the executor drives the story generator directly against promises, and injects an extra trailing argument into every executed story — a `run` function that resolves a sub-story to a plain `Promise` — so stories can `await` other stories instead of relying solely on the generator runtime.

- **Runtime behaviour, not infrastructure:** this deploys no AWS resource. It changes which processor handles `SystemActionType.ExecuteStory` at runtime.

```typescript
import { definePromiseMode } from '@qpqjs/core';

export default [
  ...definePromiseMode(),
];
```

## Signature

```typescript
function definePromiseMode(): QPQConfig;
```

## Parameters

None. `definePromiseMode()` takes no arguments and returns a `QPQConfig` (an array containing a single action-processor override). Spread it (`...definePromiseMode()`) into your config's top-level array.

## Notes

- The override targets the `SystemExecuteStory` action; when active, executed stories receive an additional final `run` argument (`<T>(story) => Promise<T>`) they can use to await sub-stories.
- This is a low-level execution toggle intended for advanced use — most services do not need it.

## Related

- [defineApplicationModule](./application-module.md) — the identity settings that make up the rest of a config.
