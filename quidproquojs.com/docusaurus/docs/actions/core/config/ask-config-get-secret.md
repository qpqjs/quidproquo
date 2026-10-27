---
title: askConfigGetSecret
description: Read the value of a configured secret at runtime.
---

# askConfigGetSecret

Reads the current value of a [secret](../../../config/core/secret.md) by name and returns it as a string. Use this for credentials, API keys, and other sensitive values that must not live in source or plain config.

- **Action type:** `ConfigActionType.GetSecret`
- **On AWS:** fetches the value from AWS Secrets Manager (`secretsmanager:GetSecretValue`). The secret itself is provisioned by [defineSecret](../../../config/core/secret.md).

```typescript
import { askConfigGetSecret, askNetworkRequest } from '@qpqjs/core';

interface Charge {
  id: string;
}

export function* askCreateCharge(amountCents: number) {
  const apiKey = yield* askConfigGetSecret('payment-provider-api-key');

  const response = yield* askNetworkRequest<{ amount: number }, Charge>('POST', 'https://api.example.com/charges', {
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { amount: amountCents },
  });

  return response.data;
}
```

## Signature

```typescript
function* askConfigGetSecret(
  secretName: string,
): AskResponse<string>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `secretName` | `string` | Name of the secret — must match a secret declared with [defineSecret](../../../config/core/secret.md) (or one shared via its `owner` option). |

## Returns

`string` — the secret's current value.

## Errors

| Error | Meaning |
| --- | --- |
| `askConfigGetSecret.errorTypeEnum.ResourceNotFound` | No secret with that name exists. |
| `askConfigGetSecret.errorTypeEnum.Throttling` | The request rate exceeded the provider's limit; back off and retry. |

## Related

- [defineSecret](../../../config/core/secret.md) — declares the secret this action reads.
- [askConfigGetParameter](./ask-config-get-parameter.md) — the equivalent for non-secret configuration values.
