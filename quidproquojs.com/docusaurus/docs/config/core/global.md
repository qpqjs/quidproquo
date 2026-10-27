---
title: defineGlobal
description: Define a global — a named, typed, constant value baked into the application config and read at runtime.
---

# defineGlobal

Declares a **global**: a named, typed, constant value stored directly in the application config. Unlike a [secret](./secret.md) or [parameter](./parameter.md) — which live in an external store — a global's value is baked into the resolved config, so reading it involves no network call and works on every runtime, including local JS execution. Stories read it with [askConfigGetGlobal](../../actions/core/config/ask-config-get-global.md).

Use a global for a fixed value that belongs in config rather than hard-coded in a story and never changes at runtime.

```typescript
import { defineGlobal } from '@qpqjs/core';

export default [
  defineGlobal('feature-limits', { maxUploadsPerDay: 100 }),
  defineGlobal('support-email', 'help@example.com'),
];
```

## Signature

```typescript
function defineGlobal<T>(
  key: string,
  value: T,
): GlobalQPQConfigSetting<T>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `key` | `string` | The name of the global, and its `uniqueKey` within the config. This is the name you pass to [askConfigGetGlobal](../../actions/core/config/ask-config-get-global.md). |
| `value` | `T` | The value to store. Any JSON-serializable type — string, number, object, array. `T` is inferred from what you pass and flows through to the read action's return type. |

## Related

- [askConfigGetGlobal](../../actions/core/config/ask-config-get-global.md) — reads the global at runtime.
- [defineParameter](./parameter.md) — for values that change at runtime.
- [defineSecret](./secret.md) — for sensitive values.
- [defineApplicationVersion](./application-version.md) — a specialised global that records the service's version string.
- [defineWebSocketQueue](../features/web-socket-queue.md) — stores its event-bus and user-directory names in globals like these.
