---
title: askApiKeyValidationValidate
description: Validate a provided API key value against a set of declared API keys.
---

# askApiKeyValidationValidate

Validates a provided API key value against a list of [declared API keys](../../../config/webserver/api-key.md), returning whether it matches any of them. This is the runtime half of API-key auth: the webserver's route-auth flow calls it with the value from the `x-api-key` header and the keys a route references, but you can also call it directly to gate custom logic.

- **Action type:** `ApiKeyValidationActionType.Validate`
- **On AWS:** for each referenced key the processor resolves the API Gateway key id (from a CloudFormation export), fetches the real key value, and compares it to the presented value using a **constant-time** equality check. Keys are looked up individually (not by listing all keys) so the IAM grant stays per-key.

```typescript
import { askApiKeyValidationValidate } from '@qpqjs/webserver';

export function* askGuardWebhook(presentedKey: string) {
  const isValid = yield* askApiKeyValidationValidate(presentedKey, [
    { name: 'partner-api' },
  ]);

  if (!isValid) {
    // reject the request
  }
}
```

## Signature

```typescript
function* askApiKeyValidationValidate(
  apiKeyValue: string,
  apiKeyReferences: ApiKeyReference[],
): AskResponse<boolean>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `apiKeyValue` | `string` | The key value presented by the caller (e.g. the `x-api-key` header). |
| `apiKeyReferences` | `ApiKeyReference[]` | The keys to validate against. The presented value matches if it equals **any** of these. |

### `ApiKeyReference`

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | The key name, matching the `apiKeyName` passed to [defineApiKey](../../../config/webserver/api-key.md). |
| `applicationName` | `string` | Application that owns the key, when it lives in a different application. Defaults to the current application. |
| `serviceName` | `string` | Service/module that owns the key, when it lives in a different service. Defaults to the current service. |

## Returns

`boolean` — `true` if the presented value matches at least one of the referenced keys, otherwise `false`. A reference that can't be resolved (unknown key, missing export) simply doesn't match rather than raising; an empty or mismatched value returns `false`.

## Notes

- Comparison is constant-time on AWS to avoid leaking key material through timing.
- Route auth uses this action automatically when a route declares `routeAuthSettings.apiKeys` — you typically declare the key with [defineApiKey](../../../config/webserver/api-key.md) and reference it from the route rather than calling this action yourself.

## Related

- [defineApiKey](../../../config/webserver/api-key.md) — declares the keys this action validates against.
- [defineAuthSystem](../../../config/webserver/auth-system.md) — the complementary user-directory / access-token route auth.
