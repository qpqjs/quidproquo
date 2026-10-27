---
title: defineApplicationVersion
description: Record a deployable version string for the service, readable at runtime as a global.
---

# defineApplicationVersion

Records a **version string** for the service. It is a thin convenience over [defineGlobal](./global.md): it stores the value under the reserved global key `qpq-application-version`, so the running application can report which version it is.

Use it to stamp a build number, git SHA, or semver into a deployment and surface it later (for a health/version endpoint, log tagging, or cache-busting).

- **On AWS:** does not deploy a resource of its own — the version is baked into the resolved config as a [global](./global.md), so reading it at runtime involves no network call.

```typescript
import { defineApplicationVersion } from '@qpqjs/core';

export default [
  ...defineApplicationVersion('1.4.2'),
];
```

## Signature

```typescript
function defineApplicationVersion(
  version: string,
): QPQConfig;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `version` | `string` | The version string to record. Stored as a global under the reserved key `qpq-application-version`. |

## Reading the version at runtime

The value is stored as a global, so a story can read it with [askConfigGetGlobal](../../actions/core/config/ask-config-get-global.md) using the same reserved key, or via the `askGetApplicationVersion` story, which wraps that read and returns `null` when no version has been defined:

```typescript
import { askGetApplicationVersion } from '@qpqjs/core';

export function* reportVersion() {
  const version = yield* askGetApplicationVersion(); // string | null
  return version ?? 'unknown';
}
```

## Notes

- The call returns an array of settings — spread it (`...defineApplicationVersion(...)`) into your config's top-level array.
- The reserved key is exported as the constant `qpqApplicationVersionGlobal` (`'qpq-application-version'`).

## Related

- [defineGlobal](./global.md) — the underlying mechanism; `defineApplicationVersion` is a specialised global.
- [askConfigGetGlobal](../../actions/core/config/ask-config-get-global.md) — reads any global, including the version key.
- [defineApplication](./application-name.md) / [defineModule](./module-name.md) — the rest of the service identity.
