---
title: askConfigListParameters
description: List the names of all configured parameters.
---

# askConfigListParameters

Returns the names of every [parameter](../../../config/core/parameter.md) available to the service. Useful for discovery or for iterating over a set of parameters whose names you don't know ahead of time.

- **Action type:** `ConfigActionType.ListParameters`
- **On AWS:** enumerates AWS Systems Manager Parameter Store (`ssm:DescribeParameters`).

```typescript
import { askConfigListParameters, askConfigGetParameter } from '@qpqjs/core';

export function* askDumpAllParameters() {
  const names = yield* askConfigListParameters();

  const entries = [];
  for (const name of names) {
    entries.push([name, yield* askConfigGetParameter(name)]);
  }
  return entries;
}
```

## Signature

```typescript
function* askConfigListParameters(): AskResponse<string[]>;
```

## Returns

`string[]` — the names of all available parameters.

## Errors

| Error | Meaning |
| --- | --- |
| `ConfigListParametersErrorTypeEnum.Throttling` | The request rate exceeded the provider's limit; back off and retry. |

## Related

- [askConfigGetParameter](./ask-config-get-parameter.md) / [askConfigGetParameters](./ask-config-get-parameters.md) — read parameter values.
- [defineParameter](../../../config/core/parameter.md) — declares a parameter.
