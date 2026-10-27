---
title: defineParameter
description: Define a parameter — a named, non-secret configuration value that can change at runtime (an SSM Parameter Store entry on AWS).
---

# defineParameter

Declares a **parameter**: a named, non-secret configuration value that can be read — and changed — at runtime without a redeploy. Good for feature flags, external endpoints, and tunable limits. Stories read it with [askConfigGetParameter](../../actions/core/config/ask-config-get-parameter.md) and can update it with [askConfigSetParameter](../../actions/core/config/ask-config-set-parameter.md).

- **On AWS:** provisions an AWS Systems Manager Parameter Store `StringParameter` (Standard tier) and grants the service's role `ssm:GetParameter`, `ssm:GetParameters`, and `ssm:DescribeParameters`. The physical name is derived from application/module/environment.

```typescript
import { defineParameter } from '@qpqjs/core';

export default [
  // Seed an initial value; it can be changed later at runtime.
  defineParameter('new-checkout-enabled', { value: 'false' }),
];
```

## Signature

```typescript
function defineParameter(
  key: string,
  options?: QPQConfigAdvancedParameterSettings,
): ParameterQPQConfigSetting;
```

## Parameters

### `key` — `string` (required)

The name of the parameter, and its `uniqueKey` within the config. This is the name you pass to the parameter actions.

### `options` — `QPQConfigAdvancedParameterSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | `''` | An initial value provisioned at deploy time. Runtime writes via [askConfigSetParameter](../../actions/core/config/ask-config-set-parameter.md) override it. |
| `owner` | `CrossModuleOwner<'parameterName'>` | – | Declares that the parameter is owned by **another** module/service, so this service is granted access rather than creating its own. `{ module, application, feature, environment, parameterName }` — all optional; unset parts default to the current service. |

## Notes

- Parameters store **strings** — serialize structured values (e.g. `JSON.stringify`) yourself.
- For sensitive values use [defineSecret](./secret.md); for fixed typed constants that never change at runtime use [defineGlobal](./global.md).

## Related

- [askConfigGetParameter](../../actions/core/config/ask-config-get-parameter.md) / [askConfigGetParameters](../../actions/core/config/ask-config-get-parameters.md) — read values.
- [askConfigSetParameter](../../actions/core/config/ask-config-set-parameter.md) — update a value.
- [askConfigListParameters](../../actions/core/config/ask-config-list-parameters.md) — list names.
- [defineSecret](./secret.md) — sensitive values. [defineGlobal](./global.md) — fixed constants.
