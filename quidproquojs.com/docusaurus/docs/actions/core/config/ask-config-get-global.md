---
title: askConfigGetGlobal
description: Read a typed global value baked into the application config at runtime.
---

# askConfigGetGlobal

Reads a [global](../../../config/core/global.md) config value by name. Globals are typed, constant values declared in config with [defineGlobal](../../../config/core/global.md) and resolved from the config itself at runtime — no external store or network call. Reach for a global when you have a fixed value that belongs in config rather than hard-coded in a story, and that never changes at runtime (unlike a [parameter](../../../config/core/parameter.md)).

- **Action type:** `ConfigActionType.GetGlobal`
- **Resolution:** the value is read straight from the resolved `QPQConfig`, so it works on every runtime — including local JS execution with no cloud resources.

```typescript
import { askConfigGetGlobal } from '@qpqjs/core';

interface FeatureLimits {
  maxUploadsPerDay: number;
}

export function* askGetUploadLimit() {
  const limits = yield* askConfigGetGlobal<FeatureLimits>('feature-limits');
  return limits.maxUploadsPerDay;
}
```

## Signature

```typescript
function* askConfigGetGlobal<T>(
  globalName: string,
): AskResponse<T>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `globalName` | `string` | Name of the global — must match one declared with [defineGlobal](../../../config/core/global.md). |

The type parameter `T` is the shape of the stored value; it's up to you to keep it in sync with what [defineGlobal](../../../config/core/global.md) stored.

## Returns

`T` — the global's value, typed as you declared.

## Related

- [defineGlobal](../../../config/core/global.md) — declares the global value this action reads.
- [askConfigGetParameter](./ask-config-get-parameter.md) — for values that change at runtime.
- [askConfigGetSecret](./ask-config-get-secret.md) — for sensitive values.
- [defineApplicationVersion](../../../config/core/application-version.md) — stores a version string as a global read with this action.
- [askEventDocProvideStoreFromGlobals](../../features/event-doc/ask-event-doc-provide-store.md#askeventdocprovidestorefromglobals) — bridges per-route globals read with this action into the event-doc store context.
