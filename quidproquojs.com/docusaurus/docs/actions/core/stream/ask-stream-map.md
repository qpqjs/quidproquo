---
title: askStreamMap
description: Read an open stream to completion, transform each chunk, collect the results into an array, then close it.
---

# askStreamMap

Drives an open stream to completion and collects it into an array. It reads chunk after chunk, runs an optional transform callback on each one, pushes the result, and closes the stream when it reports `done`. Use it when you want the *whole* stream materialised as a list — e.g. gather every event of a model response, or turn a streamed file's chunks into an array of parsed records.

`askStreamMap` is not a distinct action; it is a story composed of [askStreamRead](./ask-stream-read.md) and [askStreamClose](./ask-stream-close.md). It reads in the default blocking mode, skips any chunk whose `data` is `undefined` or that is marked `skipped`, stops on `done`, and always closes the handle before returning the collected array. When no callback is supplied, the chunks are collected as-is.

```typescript
import { askAiPromptStream, askStreamMap, AiModel } from '@qpqjs/core';

export function* askCollectStreamedParts(prompt: string) {
  const stream = yield* askAiPromptStream(AiModel.ClaudeSonnet46, prompt);

  // No callback — collect every AiStreamPart into an array.
  const parts = yield* askStreamMap(stream);

  return parts;
}
```

With a transform callback, map each chunk to a value of your choosing:

```typescript
import { askFileStreamOpen, askStreamMap } from '@qpqjs/core';

export function* askChunkLengths(filepath: string) {
  const handle = yield* askFileStreamOpen('logs', filepath, 'text');

  const lengths = yield* askStreamMap(handle, function* (chunk, index) {
    return chunk.length;
  });

  return lengths;
}
```

## Signature

```typescript
function* askStreamMap<E extends StreamEncoding, T, R = StreamDataType<E, T>>(
  handle: StreamHandle<E, T>,
  askCallback?: (item: StreamDataType<E, T>, index: number) => AskResponse<R>,
): AskResponse<R[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `handle` | `StreamHandle<E, T>` | The handle returned by the action that opened the stream, e.g. [askFileStreamOpen](../file/ask-file-stream-open.md) or [askAiPromptStream](../ai/ask-ai-prompt-stream.md). |
| `askCallback` | `(item, index) => AskResponse<R>` | Optional story (generator) run once per delivered chunk to transform it. `item` is the decoded chunk; `index` is its 0-based position among delivered chunks. Defaults to a pass-through that collects the chunks unchanged. Skipped / empty chunks are not passed to it. |

## Returns

`R[]` — an array of the callback's results in stream order (or the raw chunks when no callback is given). Resolves once the stream is exhausted and closed.

## Notes

- The `index` counts only chunks handed to your callback — chunks that are `skipped` or carry no `data` are dropped and do not advance it.
- The handle is closed for you when the loop ends. This includes failures: when a read or your callback fails, the stream is closed first and the original error is then rethrown, so a surrounding [askCatch](../system/ask-catch.md) can handle it without leaking the stream.
- Because it buffers the entire stream in memory, prefer [askStreamProcess](./ask-stream-process.md) when you only need to react to each chunk and don't need the full list.

## Related

- [askStreamProcess](./ask-stream-process.md) — the per-chunk counterpart; returns `void`.
- [askStreamRead](./ask-stream-read.md) / [askStreamClose](./ask-stream-close.md) — the actions this story is built from.
- [askAiPromptStream](../ai/ask-ai-prompt-stream.md) — collect a model response into an array of events.
- [askFileStreamOpen](../file/ask-file-stream-open.md) — stream a large file chunk by chunk.
- [askEventDocAiProcessSend](../../features/event-doc-ai/ask-event-doc-ai-process-send.md) — uses this to dispatch each AI stream part to the chat UI.
