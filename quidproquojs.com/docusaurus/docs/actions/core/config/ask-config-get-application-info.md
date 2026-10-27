---
title: askConfigGetApplicationInfo
description: Read the running service's application, environment, module, and feature identity.
---

# askConfigGetApplicationInfo

Returns the identity of the currently running service — its application name, deployment environment, module, and optional feature. Use it when a story needs to know *where* it's running, e.g. to build environment-scoped resource names, tag logs, or branch behaviour between `development` and `production`.

- **Action type:** `ConfigActionType.GetApplicationInfo`
- **Resolution:** derived from the resolved `QPQConfig` — no external call.

```typescript
import { askConfigGetApplicationInfo } from '@qpqjs/core';

export function* askIsProduction() {
  const { environment } = yield* askConfigGetApplicationInfo();
  return environment === 'production';
}
```

## Signature

```typescript
function* askConfigGetApplicationInfo(): AskResponse<ApplicationConfigInfo>;
```

## Returns

`ApplicationConfigInfo`:

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | The application name (from `defineApplication`). |
| `environment` | `string` | The deployment environment, e.g. `development` / `production`. |
| `module` | `string` | The module name (from `defineModule`). |
| `feature` | `string?` | The feature branch/name, when the service is deployed as a feature environment. |

## Related

- [defineApplication](../../../config/core/application-name.md) — sets `name` (and `environment`, `feature`).
- [defineModule](../../../config/core/module-name.md) — sets `module`.
