---
title: defineApplicationModule
description: Declare a service's application, module, and API build path in one call — the standard entry point at the top of a QPQ config.
---

# defineApplicationModule

The standard way to declare a service's identity. `defineApplicationModule` is a convenience that expands into three settings at once — [defineApplication](./application-name.md), [defineModule](./module-name.md), and [defineApiBuildPath](./api-build-path.md) — so a config's opening line establishes the application, module, environment, config root, and build output path together.

It returns a `QPQConfig` (an array of settings), which you spread into your config alongside the rest of your `define*` calls.

- **On AWS:** does not deploy a resource of its own. It contributes the identity and build-path values that the deploy layer uses to name and package every other resource.

```typescript
import { defineApplicationModule } from '@qpqjs/core';

export default [
  ...defineApplicationModule('my-app', 'web', 'production', __dirname, './build/api'),

  // ...the rest of your settings
];
```

## Signature

```typescript
function defineApplicationModule(
  applicationName: string,
  moduleName: string,
  environment: string,
  configRoot: string,
  apiBuildPath: string,
  feature?: string,
): QPQConfig;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `applicationName` | `string` | – (required) | Passed to [defineApplication](./application-name.md) as the application name. |
| `moduleName` | `string` | – (required) | Passed to [defineModule](./module-name.md) as the module name. |
| `environment` | `string` | – (required) | Passed to [defineApplication](./application-name.md) as the deployment environment. |
| `configRoot` | `string` | – (required) | Passed to [defineApplication](./application-name.md) as the config root — almost always `__dirname`. |
| `apiBuildPath` | `string` | – (required) | Passed to [defineApiBuildPath](./api-build-path.md) as the compiled-API output directory. |
| `feature` | `string` | `undefined` | Optional feature name, forwarded to [defineApplication](./application-name.md). Set it to deploy an isolated feature environment. |

## Notes

- The call returns an array of settings. Spread it (`...defineApplicationModule(...)`) into your config's top-level array.
- For the meaning of each underlying value and how it is consumed at deploy/runtime, see the individual pages linked below.

## Related

- [defineApplication](./application-name.md) — application name, environment, config root, feature.
- [defineModule](./module-name.md) — module name.
- [defineApiBuildPath](./api-build-path.md) — compiled-API output directory.
- [defineApplicationVersion](./application-version.md) — records a deployable version string.
