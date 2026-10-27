---
title: askStreamProcess
description: Read an open stream to completion, running a callback for each chunk, then close it.
---

# askStreamProcess

Drives an open stream to completion: it reads chunk after chunk, invokes your callback for each one, and closes the stream when the stream reports `done`. Use it when you want to *react* to each chunk as it arrives — forwarding tokens to a client, tallying a running total — without accumulating a result.

`askStreamProcess` is not a distinct action; it is a story composed of [askStreamRead](./ask-stream-read.md) and [askStreamClose](./ask-stream-close.md). It reads in the default blocking mode, skips any chunk whose `data` is `undefined` or that is marked `skipped`, stops on `done`, and always closes the handle before returning.

```typescript
import { askAiPromptStream, askStreamProcess, AiModel, AiStreamPartType } from '@qpqjs/core';

export function* askAnswerStreamed(prompt: string) {
  const stream = yield* askAiPromptStream(AiModel.ClaudeSonnet46, prompt);

  yield* askStreamProcess(stream, function* (part, index) {
    if (part.type === AiStreamPartType.TextDelta) {
      // forward part.text to the client...
    }
  });
}
```

## Signature

```typescript
function* askStreamProcess<E extends StreamEncoding, T>(
  handle: StreamHandle<E, T>,
  askCallback: (item: StreamDataType<E, T>, index: number) => AskResponse<void>,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `handle` | `StreamHandle<E, T>` | The handle returned by the action that opened the stream, e.g. [askFileStreamOpen](../file/ask-file-stream-open.md) or [askAiPromptStream](../ai/ask-ai-prompt-stream.md). |
| `askCallback` | `(item, index) => AskResponse<void>` | A story (generator) run once per delivered chunk. `item` is the decoded chunk (`string`, `Uint8Array`, or the parsed object, per the handle's encoding); `index` is its 0-based position among delivered chunks. Skipped / empty chunks are not passed to it. |

## Returns

`void` — resolves once the stream is exhausted and closed.

## Notes

- The `index` counts only chunks handed to your callback — chunks that are `skipped` or carry no `data` are dropped and do not advance it.
- The handle is closed for you when the loop ends. This includes failures: when a read or your callback fails, the stream is closed first and the original error is then rethrown, so a surrounding [askCatch](../system/ask-catch.md) can handle it without leaking the stream.
- If you need finer control — reading only part of a stream, or polling with `noWait` — drive [askStreamRead](./ask-stream-read.md) / [askStreamClose](./ask-stream-close.md) directly instead.
- To build up a result rather than react to each chunk, use [askStreamMap](./ask-stream-map.md).

## Related

- [askStreamMap](./ask-stream-map.md) — the collecting counterpart; returns an array.
- [askStreamRead](./ask-stream-read.md) / [askStreamClose](./ask-stream-close.md) — the actions this story is built from.
- [askAiPromptStream](../ai/ask-ai-prompt-stream.md) — a common source of streams to process.
- [askFileStreamOpen](../file/ask-file-stream-open.md) — stream a large file chunk by chunk.
