---
title: defineJavascriptRuntime
description: Select the Node.js runtime version and CPU architecture the service's functions run on.
---

# defineJavascriptRuntime

Selects the **JavaScript runtime version and CPU architecture** for the service's functions. The identifiers are cloud-agnostic; the deploy layer maps them to platform-specific values.

Declare it once per service to pin the Node version and architecture. If you omit it, the service uses the defaults below.

- **On AWS:** does not deploy a resource of its own, but every Lambda the service deploys is configured from it. The deploy layer maps `runtimeVersion` to an `aws_lambda.Runtime` (Node 20/22/24) and `architecture` to an `aws_lambda.Architecture` (`getLambdaRuntime` / `getLambdaArchitecture` in `@qpqjs/deploy-awscdk`, via `qpqCoreUtils.getJavascriptRuntimeConfig`).

```typescript
import { defineJavascriptRuntime, JavascriptRuntimeVersion } from '@qpqjs/core';

export default [
  defineJavascriptRuntime({ runtimeVersion: JavascriptRuntimeVersion.Node24 }),
];
```

## Signature

```typescript
function defineJavascriptRuntime(
  options?: QPQConfigAdvancedJavascriptRuntimeSettings,
): JavascriptRuntimeQPQConfigSetting;
```

## Parameters

### `options` — `QPQConfigAdvancedJavascriptRuntimeSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `runtimeVersion` | `JavascriptRuntimeVersion` | `Node22` | The Node.js version the functions run on. |
| `architecture` | `JavascriptRuntimeArchitecture` | `Arm64` | The CPU architecture the functions run on. |

### `JavascriptRuntimeVersion`

| Member | Value | AWS Lambda runtime |
| --- | --- | --- |
| `Node20` | `'node20'` | `NODEJS_20_X` |
| `Node22` | `'node22'` | `NODEJS_22_X` (default) |
| `Node24` | `'node24'` | `NODEJS_24_X` |

### `JavascriptRuntimeArchitecture`

| Member | Value | AWS Lambda architecture |
| --- | --- | --- |
| `Arm64` | `'arm64'` | `ARM_64` (default) |
| `X86_64` | `'x86_64'` | `X86_64` |

## Notes

- When this setting is absent, the runtime resolver falls back to `defineJavascriptRuntime()` with no options, i.e. Node 22 on Arm64.

## Examples

```typescript
import {
  defineJavascriptRuntime,
  JavascriptRuntimeVersion,
  JavascriptRuntimeArchitecture,
} from '@qpqjs/core';

export default [
  // Pin to Node 24 on x86_64
  defineJavascriptRuntime({
    runtimeVersion: JavascriptRuntimeVersion.Node24,
    architecture: JavascriptRuntimeArchitecture.X86_64,
  }),
];
```

## Related

- [defineApiBuildPath](./api-build-path.md) — the compiled code that runs on this runtime.
- [defineApplicationModule](./application-module.md) — the identity and build-path settings usually declared alongside.
