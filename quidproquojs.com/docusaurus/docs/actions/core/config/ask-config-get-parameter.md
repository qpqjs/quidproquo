---
title: askConfigGetParameter
description: Read the value of a single configured parameter at runtime.
---

# askConfigGetParameter

Reads the current value of a [parameter](../../../config/core/parameter.md) by name and returns it as a string. Parameters hold non-secret, mutable configuration — feature flags, external endpoints, tunable limits — that you want to change without redeploying code.

- **Action type:** `ConfigActionType.GetParameter`
- **On AWS:** reads from AWS Systems Manager Parameter Store (`ssm:GetParameter`). The parameter is provisioned by [defineParameter](../../../config/core/parameter.md).

```typescript
import { askConfigGetParameter } from '@qpqjs/core';

export function* askGetFeatureFlag() {
  const flag = yield* askConfigGetParameter('new-checkout-enabled');
  return flag === 'true';
}
```

## Signature

```typescript
function* askConfigGetParameter(
  parameterName: string,
): AskResponse<string>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `parameterName` | `string` | Name of the parameter — must match one declared with [defineParameter](../../../config/core/parameter.md) (or shared via its `owner` option). |

## Returns

`string` — the parameter's current value.

## Errors

| Error | Meaning |
| --- | --- |
| `ConfigGetParameterErrorTypeEnum.Throttling` | The request rate exceeded the provider's limit; back off and retry. |

## Related

- [defineParameter](../../../config/core/parameter.md) — declares the parameter this action reads.
- [askConfigGetParameters](./ask-config-get-parameters.md) — read several parameters in one call.
- [askConfigSetParameter](./ask-config-set-parameter.md) — update a parameter's value.
- [askConfigListParameters](./ask-config-list-parameters.md) — list all parameter names.
- [askConfigGetSecret](./ask-config-get-secret.md) — the equivalent for sensitive values.
