---
title: askConfigGetParameters
description: Read several configured parameters in a single call.
---

# askConfigGetParameters

Reads several [parameters](../../../config/core/parameter.md) at once, returning their values as a string array in the same order as the names you passed. Prefer this over multiple [askConfigGetParameter](./ask-config-get-parameter.md) calls when you need a handful of values — it's one round-trip.

- **Action type:** `ConfigActionType.GetParameters`
- **On AWS:** reads from AWS Systems Manager Parameter Store (`ssm:GetParameters`).

```typescript
import { askConfigGetParameters } from '@qpqjs/core';

export function* askLoadEndpoints() {
  const [billingUrl, searchUrl] = yield* askConfigGetParameters(['billing-endpoint', 'search-endpoint']);
  return { billingUrl, searchUrl };
}
```

## Signature

```typescript
function* askConfigGetParameters(
  parameterNames: string[],
): AskResponse<string[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `parameterNames` | `string[]` | Names of the parameters to read. Each must match one declared with [defineParameter](../../../config/core/parameter.md). |

## Returns

`string[]` — the parameter values, positionally aligned with `parameterNames`.

## Errors

| Error | Meaning |
| --- | --- |
| `ConfigGetParametersErrorTypeEnum.Throttling` | The request rate exceeded the provider's limit; back off and retry. |

## Related

- [askConfigGetParameter](./ask-config-get-parameter.md) — read a single parameter.
- [defineParameter](../../../config/core/parameter.md) — declares the parameters.
