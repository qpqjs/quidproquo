---
title: defineApplication
description: Define the application identity — application name, environment, config root, and optional feature — that scopes every deployed resource.
---

# defineApplication

Declares the **application identity** for a service: its application name, deployment environment, config root directory, and optional feature name. Together with [defineModule](./module-name.md), these values form the prefix used to name every resource the service deploys, so the same config can deploy independently to multiple environments (and feature branches) without collisions.

Most services do not call `defineApplication` directly — [defineApplicationModule](./application-module.md) is the usual entry point, which calls `defineApplication`, `defineModule`, and [defineApiBuildPath](./api-build-path.md) in one step.

- **On AWS:** does not deploy a resource of its own. Its values are read by the deploy layer (`qpqCoreUtils.getFullyQualifiedResourceName`) to derive the physical name of every construct — buckets, tables, queues, functions, etc. — as `application / module / environment / feature / resourceName`.

```typescript
import { defineApplication } from '@qpqjs/core';

export default [
  defineApplication('my-app', 'production', __dirname),
];
```

## Signature

```typescript
function defineApplication(
  applicationName: string,
  environment: string,
  configRoot: string,
  feature?: string,
): ApplicationQPQConfigSetting;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `applicationName` | `string` | – (required) | The application name, and this setting's `uniqueKey`. Prefixes every physical resource name and is surfaced to stories via [askConfigGetApplicationInfo](../../actions/core/config/ask-config-get-application-info.md) (`name`). Resolved internally with `qpqCoreUtils.getApplicationName`. |
| `environment` | `string` | – (required) | The deployment environment (e.g. `development`, `production`). Part of the resource-name prefix and the key that [defineEnvironmentSettings](./environment-settings.md) branches on. Resolved with `qpqCoreUtils.getApplicationModuleEnvironment` (falls back to `production` if unset at read time). Surfaced to stories as `environment`. |
| `configRoot` | `string` | – (required) | The absolute root directory of the service config, almost always `__dirname`. The deploy layer joins paths such as the [API build path](./api-build-path.md) against this root. Resolved with `qpqCoreUtils.getConfigRoot`. |
| `feature` | `string` | `undefined` | Optional feature name. When set, the service deploys as an isolated feature environment — `feature` becomes part of the resource-name prefix, keeping a feature branch's resources separate from the main environment. Surfaced to stories as `feature`. |

## Notes

- The `environment` value also drives config flattening: [defineEnvironmentSettings](./environment-settings.md) selects the child settings whose key matches the current environment.
- Because `applicationName` is the setting's `uniqueKey`, a config should declare exactly one application identity.

## Examples

```typescript
import { defineApplication } from '@qpqjs/core';

export default [
  // Standard production identity
  defineApplication('billing', 'production', __dirname),

  // A feature environment — isolates this branch's resources
  defineApplication('billing', 'development', __dirname, 'checkout-redesign'),
];
```

## Related

- [defineModule](./module-name.md) — the module half of the service identity.
- [defineApplicationModule](./application-module.md) — the convenience that declares application, module, and API build path together.
- [defineApplicationVersion](./application-version.md) — records a deployable version string.
- [askConfigGetApplicationInfo](../../actions/core/config/ask-config-get-application-info.md) — reads this identity (name, environment, module, feature) from a story.
