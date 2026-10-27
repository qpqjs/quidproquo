---
title: askServiceFunctionExecute
description: Invoke a service function (an RPC-style story) by name and receive its typed result.
---

# askServiceFunctionExecute

Invokes a [service function](../../../config/webserver/service-function.md) — a story deployed for direct, RPC-style invocation — by name, passing a typed payload and receiving the function's typed result. Use it to call another service's (or your own service's) business logic directly, without going through an HTTP route.

- **Action type:** `ServiceFunctionActionType.Execute`
- **On AWS:** invokes the target function's dedicated Lambda (`<functionName>-sfunc`) directly by name. When `isAsync` is `false` (the default) the call is synchronous and returns the function's result; when `true` it is a fire-and-forget async invocation that resolves without a result.

```typescript
import { askServiceFunctionExecute } from '@qpqjs/webserver';

interface ResizeRequest {
  drive: string;
  filepath: string;
  width: number;
}
interface ResizeResult {
  thumbnailPath: string;
}

export function* askMakeThumbnail(filepath: string) {
  const result = yield* askServiceFunctionExecute<ResizeResult, ResizeRequest>(
    'media', // service name
    'resizeImage', // function name
    { drive: 'uploads', filepath, width: 256 }
  );

  return result.thumbnailPath;
}
```

## Signature

```typescript
function* askServiceFunctionExecute<R, T>(
  service: string,
  functionName: string,
  payload: T,
  isAsync?: boolean
): AskResponse<R>;
```

## Parameters

| Parameter      | Type      | Default | Description                                                                                                                                     |
| -------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `service`      | `string`  | –       | Name of the service that owns the target function.                                                                                              |
| `functionName` | `string`  | –       | Name of the [service function](../../../config/webserver/service-function.md) to invoke (its `functionName`, which defaults to the story name). |
| `payload`      | `T`       | –       | The typed payload passed to the function's story.                                                                                               |
| `isAsync`      | `boolean` | `false` | When `false`, wait for and return the result. When `true`, invoke fire-and-forget and resolve without a result.                                 |

## Returns

`R` — the value returned by the invoked function's story. When `isAsync` is `true` there is no meaningful result (the async invocation resolves without waiting for the function to finish).

## Related

- [defineServiceFunction](../../../config/webserver/service-function.md) — declares the function this action invokes.
- [askServiceRequest](../../features/web-socket-queue/ask-service-request.md) — a related request to another service, dispatched by method name.
- [askCatch](../../core/system/ask-catch.md) — catch errors thrown by the invoked function.
