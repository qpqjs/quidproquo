---
title: defineApiKey
description: Declare an API key — a shared secret (an AWS API Gateway API key) used to authenticate requests to a route.
---

# defineApiKey

Declares an **API key**: a named shared secret that callers present in the `x-api-key` request header to authenticate against a route. Unlike user-directory auth (which identifies a *user* via an access token), an API key identifies a *caller* — typically a machine, service, or third party. You declare the key here, reference it from a route's `routeAuthSettings.apiKeys`, and the runtime validates the presented header against the real key value.

- **On AWS:** deploys an **API Gateway API key** (`aws_apigateway.ApiKey` via `QpqWebserverApiKeyConstruct` in `@qpqjs/deploy-awscdk`). The key is created with `enabled: true`, its physical name is derived from the config (prefixed with application/module/environment), and its CloudFormation-exported id is what the runtime resolves to fetch the real key value during validation. If `value` is omitted, AWS generates the key value automatically.

```typescript
import { defineApiKey } from '@qpqjs/webserver';

export default [
  // AWS generates the key value
  defineApiKey('partner-api'),
];
```

## Signature

```typescript
function defineApiKey(
  apiKeyName: string,
  options?: QPQConfigAdvancedApiKeySettings,
): ApiKeyQPQWebServerConfigSetting;
```

## Parameters

### `apiKeyName` — `string` (required)

The name of the key. This is the `name` you reference from a route (`routeAuthSettings.apiKeys: ['partner-api']`) and the key's `uniqueKey` within the config. On AWS it is used to derive the physical API Gateway key name.

### `options` — `QPQConfigAdvancedApiKeySettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | – | The explicit key value (the secret string callers present). When omitted, AWS generates the value automatically — retrieve it from the API Gateway console/API after deploy. Provide a value when you need to pin a known secret. |
| `description` | `string` | – | Human-readable description attached to the API Gateway key. |
| `deprecated` | `boolean` | `false` | Inherited from `QPQConfigAdvancedSettings`; marks the setting as deprecated. |

## Referencing a key from a route

A key does nothing on its own — a route opts into it via `routeAuthSettings.apiKeys`, which accepts either a plain key name or an `ApiKeyReference` object (used to reference a key owned by another application/service):

```typescript
export interface ApiKeyReference {
  name: string;
  applicationName?: string;
  serviceName?: string;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | The key name, matching the `apiKeyName` passed to `defineApiKey`. |
| `applicationName` | `string` | Application that owns the key, when it lives in a different application. Defaults to the current application. |
| `serviceName` | `string` | Service/module that owns the key, when it lives in a different service. Defaults to the current service. |

When a route lists `apiKeys`, the runtime reads the `x-api-key` header from the incoming request and validates it with [askApiKeyValidationValidate](../../actions/webserver/api-key-validation/ask-api-key-validation-validate.md). A request missing the header, or presenting a value that matches none of the referenced keys, is rejected.

## Examples

```typescript
import { defineApiKey } from '@qpqjs/webserver';

export default [
  // Let AWS generate the secret
  defineApiKey('partner-api', {
    description: 'Key issued to the partner integration',
  }),

  // Pin a known value (e.g. seeded from a secret at deploy time)
  defineApiKey('internal-cron', {
    value: process.env.CRON_API_KEY,
    description: 'Used by the scheduled internal caller',
  }),
];
```

## Related

- [askApiKeyValidationValidate](../../actions/webserver/api-key-validation/ask-api-key-validation-validate.md) — the action that validates a presented key value against declared keys at runtime.
- **Routes and APIs** reference a key through `routeAuthSettings.apiKeys` (see the `defineRoute` / `defineApi` config settings in @qpqjs/webserver).
- [defineAuthSystem](./auth-system.md) — the other half of route auth: user-directory / access-token authentication.
