---
title: defineConfigValue
description: Define a generic named, typed value in the application config.
---

# defineConfigValue

Declares a generic **config value**: a named, typed entry stored in the application config. It's the most primitive config setting — just a name and a value of any type — and is resolved from the config settings list rather than through a dedicated action.

For most use cases prefer [defineGlobal](./global.md), which stores a value the same way but comes with a first-class read action ([askConfigGetGlobal](../../actions/core/config/ask-config-get-global.md)). Reach for `defineConfigValue` when you're building tooling that scans config settings by type and wants a plain typed value entry.

```typescript
import { defineConfigValue } from '@qpqjs/core';

export default [
  defineConfigValue('maxItems', 10),
];
```

## Signature

```typescript
function defineConfigValue<T>(
  configValueName: string,
  configValue: T,
): ConfigValueQPQConfigSetting<T>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `configValueName` | `string` | The name of the value, and its `uniqueKey` within the config. |
| `configValue` | `T` | The value to store. `T` is inferred from what you pass. |

## Related

- [defineGlobal](./global.md) — the same idea with a dedicated read action; prefer it in stories.
