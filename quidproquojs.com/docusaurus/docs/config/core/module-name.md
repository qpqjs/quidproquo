---
title: defineModule
description: Define the module name — the second half of a service's identity, used with the application name to scope every deployed resource.
---

# defineModule

Declares the **module name** for a service. A quidproquo application is composed of one or more modules; the module name, combined with the [application identity](./application-name.md), forms the prefix used to name every resource the service deploys. Two modules of the same application therefore get distinct, non-colliding resource names.

Most services do not call `defineModule` directly — [defineApplicationModule](./application-module.md) is the usual entry point, which declares the application, module, and [API build path](./api-build-path.md) in one step.

- **On AWS:** does not deploy a resource of its own. The name is read by the deploy layer (`qpqCoreUtils.getApplicationModuleName`, via `getFullyQualifiedResourceName`) as the `module` segment of every physical resource name.

```typescript
import { defineModule } from '@qpqjs/core';

export default [
  defineModule('web'),
];
```

## Signature

```typescript
function defineModule(
  moduleName: string,
): ModuleQPQConfigSetting;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `moduleName` | `string` | The module name, and this setting's `uniqueKey`. Part of every physical resource-name prefix and surfaced to stories via [askConfigGetApplicationInfo](../../actions/core/config/ask-config-get-application-info.md) (`module`). Resolved internally with `qpqCoreUtils.getApplicationModuleName`. |

## Notes

- A module must be declared before [defineServiceSettings](./service-settings.md) can be applied, because service settings are selected by the current module name.
- Because `moduleName` is the setting's `uniqueKey`, a config should declare exactly one module identity.

## Related

- [defineApplication](./application-name.md) — the application half of the service identity.
- [defineApplicationModule](./application-module.md) — the convenience that declares application, module, and API build path together.
- [defineServiceSettings](./service-settings.md) — applies extra settings keyed by module (service) name.
- [askConfigGetApplicationInfo](../../actions/core/config/ask-config-get-application-info.md) — reads the module name (and the rest of the service identity) from a story.
