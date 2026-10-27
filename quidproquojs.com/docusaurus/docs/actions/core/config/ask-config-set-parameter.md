---
title: askConfigSetParameter
description: Write a new value to a configured parameter at runtime.
---

# askConfigSetParameter

Updates the value of a [parameter](../../../config/core/parameter.md) at runtime. This lets a story change configuration that later runs (or other services) will read with [askConfigGetParameter](./ask-config-get-parameter.md) — without a redeploy.

- **Action type:** `ConfigActionType.SetParameter`
- **On AWS:** writes to AWS Systems Manager Parameter Store.

```typescript
import { askConfigSetParameter } from '@qpqjs/core';

export function* askDisableCheckout() {
  yield* askConfigSetParameter('new-checkout-enabled', 'false');
}
```

## Signature

```typescript
function* askConfigSetParameter(
  parameterName: string,
  parameterValue: string,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `parameterName` | `string` | Name of the parameter to write — must match one declared with [defineParameter](../../../config/core/parameter.md). |
| `parameterValue` | `string` | The new value. |

## Returns

`void` — the story resumes once the write has completed.

## Errors

| Error | Meaning |
| --- | --- |
| `ConfigSetParameterErrorTypeEnum.Throttling` | The request rate exceeded the provider's limit; back off and retry. |
| `ConfigSetParameterErrorTypeEnum.QuotaExceeded` | The parameter store's storage limit was hit. |

## Related

- [askConfigGetParameter](./ask-config-get-parameter.md) — read the value back.
- [defineParameter](../../../config/core/parameter.md) — declares the parameter.
