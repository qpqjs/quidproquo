---
title: askStreamClose
description: Release an open stream handle and free its underlying source.
---

# askStreamClose

Releases an open stream, freeing the underlying source (a file body, a model response, etc.) held by the runtime's stream registry. Call it once you have finished reading — including on early exit, before the stream reports `done`.

- **Action type:** `StreamActionType.Close`

```typescript
import { askFileStreamOpen, askStreamRead, askStreamClose } from '@qpqjs/core';

export function* askReadFirstChunk(filepath: string) {
  const handle = yield* askFileStreamOpen('logs', filepath, 'text');

  const chunk = yield* askStreamRead(handle);

  // We only wanted the first chunk — release the rest of the stream.
  yield* askStreamClose(handle);

  return chunk.data ?? '';
}
```

## Signature

```typescript
function* askStreamClose(
  handle: StreamHandle,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `handle` | `StreamHandle` | The handle returned by the action that opened the stream. Only its `id` is used to locate and release the stream. |

## Returns

`void` — the story resumes once the stream has been released.

## Notes

- Closing a stream that has already been closed (or that finished and was released automatically) is a no-op — it does not throw.
- The stream stories [askStreamProcess](./ask-stream-process.md) and [askStreamMap](./ask-stream-map.md) close the handle for you after they finish reading, so you only call `askStreamClose` directly when you drive the read loop yourself or bail out early.

## Related

- [askStreamRead](./ask-stream-read.md) — pull chunks from the handle before closing it.
- [askStreamProcess](./ask-stream-process.md) — reads to completion and closes for you.
- [askStreamMap](./ask-stream-map.md) — collects into an array and closes for you.
- [askFileStreamOpen](../file/ask-file-stream-open.md) — opens the stream this action releases.
- [askAiPromptStream](../ai/ask-ai-prompt-stream.md) — opens a model-response stream.
