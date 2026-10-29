---
title: defineBundleEntries
description: Make the bundler build runtimes that are only reached through the dynamic module loader.
---

# defineBundleEntries

Registers runtimes that nothing in the config references directly, so the bundler would otherwise leave them out of the deployed bundle. This is for code a plugin loads at runtime through the dynamic module loader (guards, hooks, callbacks). Anything missing from the bundle fails when it is first loaded.

- **On AWS:** no infrastructure of its own. The runtimes are added to the build sources for the service's Lambdas.

```typescript
import { defineBundleEntries } from '@qpqjs/core';

export default [
  defineBundleEntries(['/src/guards/canApprove::canApprove', '/src/actions/notify::notify']),
];
```

## Signature

```typescript
function defineBundleEntries(runtimes: QpqFunctionRuntime[]): BundleEntriesQPQConfigSetting;
```

## Parameters

### `runtimes` — `QpqFunctionRuntime[]` (required)

References (usually `'/path/to/file::exportedFunctionName'` strings) to the functions the bundler must build. The setting's `uniqueKey` is derived from all of them.

## Notes

- You can declare it more than once; every declared list is bundled.
- Plugins that load their own stories, such as `defineStateMachine`, declare their entries for you.

## Related

- [defineActionProcessors](./action-processors.md)
- [defineInlineFunction](./inline-function.md)
