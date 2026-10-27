---
title: defineServiceSettings
description: Apply different config settings per module (service), with a wildcard fallback.
---

# defineServiceSettings

Applies **different settings depending on the module (service)**. You pass a map from module name to a `QPQConfig`; when the config is resolved, only the block matching the current module (the name given to [defineModule](./module-name.md)) is included. A `'*'` key acts as a fallback for any module not listed explicitly.

Use it when several modules share one config file but each needs its own extra settings.

- **On AWS:** does not deploy a resource of its own. It is resolved during config flattening (`qpqCoreUtils`): the matching module's settings are spliced into the config and then deploy as normal.

```typescript
import { defineServiceSettings, defineParameter } from '@qpqjs/core';

export default [
  defineServiceSettings({
    web: [defineParameter('public-url', 'https://example.com')],
    worker: [defineParameter('concurrency', '10')],
    '*': [defineParameter('log-level', 'info')],
  }),
];
```

## Signature

```typescript
function defineServiceSettings(
  settingsByService: Record<string, QPQConfig>,
): ServiceSettingsQPQConfigSetting;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `settingsByService` | `Record<string, QPQConfig>` | A map from module (service) name to the settings to apply for that module. Each value is a `QPQConfig` (an array of `define*` settings). The key `'*'` is used as a fallback when the current module has no explicit entry. |

## Notes

- The module must already be declared via [defineModule](./module-name.md) (usually through [defineApplicationModule](./application-module.md)) before this resolves — otherwise flattening throws, since it has no service name to select on.
- Selection order: the exact module key wins; otherwise the `'*'` key; otherwise no settings are added for that block.
- The setting's `uniqueKey` is derived from the sorted list of module keys.

## Related

- [defineEnvironmentSettings](./environment-settings.md) — the same idea, keyed by environment instead of module.
- [defineModule](./module-name.md) — sets the module name this selects on.
