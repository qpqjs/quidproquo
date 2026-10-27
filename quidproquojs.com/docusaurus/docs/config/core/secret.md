---
title: defineSecret
description: Define a secret — a named, encrypted store for a sensitive value (a Secrets Manager secret on AWS).
---

# defineSecret

Declares a **secret**: a named container for a sensitive value like an API key, database password, or signing key. Stories read the value at runtime with [askConfigGetSecret](../../actions/core/config/ask-config-get-secret.md). The value itself is never in your config or source — it's set out-of-band in the underlying secret store and only its name lives in code.

- **On AWS:** provisions an AWS Secrets Manager secret, and grants the service's role `secretsmanager:GetSecretValue` on it. The physical secret name is derived from application/module/environment so the same config deploys cleanly to multiple environments.

```typescript
import { defineSecret } from '@qpqjs/core';

export default [
  defineSecret('anthropic-api-key'),
];
```

## Signature

```typescript
function defineSecret(
  key: string,
  options?: QPQConfigAdvancedSecretSettings,
): SecretQPQConfigSetting;
```

## Parameters

### `key` — `string` (required)

The name of the secret, and its `uniqueKey` within the config. This is the name you pass to [askConfigGetSecret](../../actions/core/config/ask-config-get-secret.md).

### `options` — `QPQConfigAdvancedSecretSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `owner` | `CrossModuleOwner<'secretName'>` | – | Declares that the secret is owned by **another** module/service, so this service is granted read access to it rather than creating its own. `{ module, application, feature, environment, secretName }` — all optional; unset parts default to the current service. |

## Notes

- `defineSecret` only provisions the secret and access to it — populating the value is done separately (e.g. in the AWS console/CLI, or a deploy step), never in config.
- For non-sensitive but runtime-mutable values, use [defineParameter](./parameter.md); for fixed typed constants, use [defineGlobal](./global.md).

## Related

- [askConfigGetSecret](../../actions/core/config/ask-config-get-secret.md) — reads the secret at runtime.
- [defineParameter](./parameter.md) — non-secret, mutable configuration.
- [defineGlobal](./global.md) — fixed, typed config constants.
- [defineSubdomainRedirect](../webserver/subdomain-redirect.md) — can store a Cloudflare API key in a secret like this.
