---
title: askNetworkRequest
description: Make an outbound HTTP request from a story.
---

# askNetworkRequest

Makes an outbound HTTP request and returns the response. Doing this as an action — rather than calling `fetch` directly — keeps stories pure and replayable: the request and its result are captured in the runtime's action history.

- **Action type:** `NetworkActionType.Request`

```typescript
import { askNetworkRequest } from 'quidproquo-core';

interface Todo {
  id: number;
  title: string;
}

export function* askGetTodo(id: string) {
  const response = yield* askNetworkRequest<undefined, Todo>('GET', `https://example.com/todos/${id}`);

  return response.data;
}
```

## Signature

```typescript
function* askNetworkRequest<T, R>(
  method: HTTPMethod,
  url: string,
  httpRequestOptions?: HTTPRequestOptions<T>,
): AskResponse<HTTPNetworkResponse<R>>;
```

`T` is the request body type; `R` is the expected response `data` type.

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `method` | `HTTPMethod` | – | The HTTP method: `'GET' \| 'HEAD' \| 'POST' \| 'PUT' \| 'DELETE' \| 'CONNECT' \| 'OPTIONS' \| 'PATCH'`. (`CONNECT` is not supported and throws.) |
| `url` | `string` | – | The request URL. If `basePath` is set and this is not an absolute URL, it is appended to `basePath`. |
| `httpRequestOptions` | `HTTPRequestOptions<T>` | – | Optional request options — see below. |

### `HTTPRequestOptions<T>`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `basePath` | `string` | – | A base URL that `url` is joined onto (path concatenation) when `url` is not already absolute. |
| `params` | `Record<string, string>` | – | Query-string parameters appended to the URL. |
| `headers` | `Record<string, string>` | – | Request headers. A `Content-Type` is set automatically for object, JSON, and URL-encoded bodies when you don't provide one. |
| `body` | `T` | – | The request body. Objects/arrays are JSON-serialised; strings, `ArrayBuffer`, typed arrays, `Blob`, `FormData`, `URLSearchParams`, and `ReadableStream` are sent as-is. Ignored for `GET` and `HEAD`. |
| `responseType` | `ResponseType` | `'json'` | How to interpret the response body: `'json'`, `'text'`, or `'binary'`. See [Returns](#returns). |

## Returns

`HTTPNetworkResponse<R>`:

| Property | Type | Description |
| --- | --- | --- |
| `data` | `R` | The parsed response body. For `responseType: 'json'` this is the parsed JSON (falling back to raw text if the body isn't valid JSON, or `undefined` for an empty body); for `'text'` it is the raw string; for `'binary'` it is a `QPQBinaryData` object (`{ base64Data, mimetype, filename }`). |
| `status` | `number` | The HTTP status code. |
| `statusText` | `string` | The HTTP status text. |
| `headers` | `Record<string, string>` | The response headers. |
| `setCookies` | `string[]` | Every raw `Set-Cookie` header line, attributes intact, in response order. `headers` can only carry the last one (`fetch` collapses duplicates), so a multi-cookie response (e.g. session + CSRF) needs this list instead. Always `[]` in browser runtimes, since `Set-Cookie` is a forbidden response header there. |

The response is returned for any completed HTTP exchange, including non-2xx statuses — inspect `status` yourself; a `404` or `500` does not throw.

## Errors

| Error | Meaning |
| --- | --- |
| `NetworkRequestErrorTypeEnum.Timeout` | The request exceeded the request timeout and was aborted. |

Errors thrown by actions can be caught with `askCatch` from quidproquo-core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askNetworkRequest('GET', 'https://example.com/slow'));

if (outcome.success) {
  const response = outcome.result;
  // response.status, response.data, ...
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Notes

- Requests abort after 30 seconds, surfacing as `NetworkRequestErrorTypeEnum.Timeout`. (30s deliberately outlasts API Gateway's 29s integration timeout, so a slow upstream shows up as a real gateway error rather than a client-side abort.)

## Related

- [askAiPrompt](../ai/ask-ai-prompt.md) — call model providers without hand-rolling the HTTP request.
