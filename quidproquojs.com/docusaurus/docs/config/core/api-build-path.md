---
title: defineApiBuildPath
description: Set the directory that holds the service's compiled API bundle, packaged and deployed as the runtime code.
---

# defineApiBuildPath

Declares the **API build path**: the directory (relative to the [config root](./application-name.md)) that contains the service's compiled/bundled backend code. The deploy layer packages this directory as the code artifact for the service's functions.

It is normally set for you by [defineApplicationModule](./application-module.md); declare it directly only when composing the identity settings by hand.

- **On AWS:** does not deploy a resource of its own. The deploy layer resolves the full path by joining the config root with this value (`qpqCoreUtils.getApiBuildPath` → `getApiBuildPathFullPath`), then uses that directory as the Lambda function code asset.

```typescript
import { defineApiBuildPath } from '@qpqjs/core';

export default [
  defineApiBuildPath('./build/api'),
];
```

## Signature

```typescript
function defineApiBuildPath(
  apiBuildPath: string,
): ApiBuildPathQPQConfigSetting;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `apiBuildPath` | `string` | Path to the compiled API bundle, relative to the config root (the `configRoot` passed to [defineApplication](./application-name.md)). Also the setting's `uniqueKey`. Resolved at deploy time with `qpqCoreUtils.getApiBuildPath` and joined against the config root to locate the code to package. |

## Related

- [defineApplicationModule](./application-module.md) — declares this alongside the application and module identity.
- [defineApplication](./application-name.md) — provides the config root this path is resolved against.
- [defineJavascriptRuntime](./javascript-runtime.md) — selects the runtime the packaged code executes on.
