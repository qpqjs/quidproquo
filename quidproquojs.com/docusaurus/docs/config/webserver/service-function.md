---
title: defineServiceFunction
description: Define a callable service function — an RPC-style story deployed as its own Lambda, invoked directly rather than over HTTP.
---

# defineServiceFunction

Defines a **service function**: a story that can be invoked directly, RPC-style, rather than being exposed as an HTTP route. Service functions are the unit of cross-service (and in-service) direct invocation — a story calls one with a typed payload and receives a typed result using [askServiceFunctionExecute](../../actions/webserver/service-function/ask-service-function-execute.md).

- **On AWS:** deploys a **dedicated Lambda** (`QpqWebserverServiceFunctionConstruct` in `@qpqjs/deploy-aws`, named `<functionName>-sfunc`) with a ~14.5-minute timeout. `askServiceFunctionExecute` invokes it directly by name — synchronously by default, or as a fire-and-forget async invocation when requested.

```typescript
import { defineServiceFunction } from '@qpqjs/webserver';

export default [
  defineServiceFunction('/src/functions/resizeImage::resizeImage'),
];
```

## Signature

```typescript
function defineServiceFunction(
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedServiceFunctionSettings,
): ServiceFunctionQPQWebServerConfigSetting;
```

## Parameters

### `runtime` — `QpqFunctionRuntime` (required)

A reference to the story the service function runs. Usually a relative path string of the form `'/path/to/file::exportedFunctionName'`. The story receives the invocation payload and returns the result.

### `options` — `QPQConfigAdvancedServiceFunctionSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `functionName` | `string` | derived from the runtime's story name | The name callers use to invoke this function (the value passed as `functionName` to `askServiceFunctionExecute`). Also the function's `uniqueKey`. |
| `virtualNetworkName` | `string` | – | Name of a `defineVirtualNetwork` (VPC) to place the Lambda in, so it can reach in-VPC data stores. |
| `maxConcurrentExecutions` | `number` | – | Reserved concurrency — a cap and a guarantee on concurrent executions of this function. Carved out of the account's shared concurrency pool. |
| `owner` | `CrossModuleOwner<'functionName'>` | – | Declares that the function is owned by **another** module/service. Use it to invoke a function deployed elsewhere; the deploy grants this service permission to invoke the foreign function instead of creating a new one. |

## Notes

- The function name defaults to the story name extracted from the runtime, so `defineServiceFunction('/src/functions/resizeImage::resizeImage')` is callable as `resizeImage` unless you override `functionName`.

## Examples

```typescript
import { defineServiceFunction } from '@qpqjs/webserver';

export default [
  // Named by its story
  defineServiceFunction('/src/functions/resizeImage::resizeImage'),

  // Explicit name + capped concurrency
  defineServiceFunction('/src/functions/sendReport::sendReport', {
    functionName: 'send-report',
    maxConcurrentExecutions: 5,
  }),
];
```

## Related

- [askServiceFunctionExecute](../../actions/webserver/service-function/ask-service-function-execute.md) — invoke a service function from a story.
- [defineRoute](./route.md) — expose a story over HTTP instead of as a direct-invoke function.
- [defineApi](./api.md) — the service's HTTP API.
