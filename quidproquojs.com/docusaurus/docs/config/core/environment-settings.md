---
title: defineEnvironmentSettings
description: Apply different config settings per deployment environment, with a wildcard fallback.
---

# defineEnvironmentSettings

Applies **different settings depending on the deployment environment**. You pass a map from environment name to a `QPQConfig`; when the config is resolved, only the block matching the current environment (the `environment` given to [defineApplication](./application-name.md)) is included. A `'*'` key acts as a fallback for any environment not listed explicitly.

Use it to vary a value between `development` and `production` — a different parameter, an extra drive in production, tighter limits per environment, and so on — without maintaining separate config files.

- **On AWS:** does not deploy a resource of its own. It is resolved during config flattening (`qpqCoreUtils`): the matching environment's settings are spliced into the config and then deploy as normal, so whatever you put inside deploys only in that environment.

```typescript
import { defineEnvironmentSettings, defineParameter } from '@qpqjs/core';

export default [
  defineEnvironmentSettings({
    production: [defineParameter('log-level', 'warn')],
    '*': [defineParameter('log-level', 'debug')],
  }),
];
```

## Signature

```typescript
function defineEnvironmentSettings(
  settingsByEnvironment: Record<string, QPQConfig>,
): EnvironmentSettingsQPQConfigSetting;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `settingsByEnvironment` | `Record<string, QPQConfig>` | A map from environment name to the settings to apply for that environment. Each value is a `QPQConfig` (an array of `define*` settings). The key `'*'` is used as a fallback when the current environment has no explicit entry. |

## Notes

- The current environment comes from [defineApplication](./application-name.md); resolution defaults the environment to `development` during flattening if none is set.
- Selection order: the exact environment key wins; otherwise the `'*'` key; otherwise no settings are added for that block.
- The setting's `uniqueKey` is derived from the sorted list of environment keys.

## Examples

```typescript
import { defineEnvironmentSettings, defineStorageDrive, defineParameter } from '@qpqjs/core';

export default [
  defineEnvironmentSettings({
    // Only production gets an archive drive
    production: [
      defineStorageDrive('archive'),
      defineParameter('rate-limit', '1000'),
    ],

    // Everything else (development, feature envs, ...) shares this
    '*': [defineParameter('rate-limit', '100')],
  }),
];
```

## Related

- [defineServiceSettings](./service-settings.md) — the same idea, keyed by module (service) name instead of environment.
- [defineApplication](./application-name.md) — sets the environment this selects on.
