---
title: askStreamRead
description: Pull the next chunk from an open stream handle.
---

# askStreamRead

Reads the next chunk from an open **stream** and returns it. A stream is never opened by this action — it is opened by some other action that hands back a [`StreamHandle`](#streamhandle), such as [askFileStreamOpen](../file/ask-file-stream-open.md) (streaming a large file) or [askAiPromptStream](../ai/ask-ai-prompt-stream.md) (streaming a model response). `askStreamRead` then pulls that stream forward one chunk at a time until it is exhausted.

- **Action type:** `StreamActionType.Read`

Each read returns a [`StreamChunk`](#streamchunk) — an envelope that tells you whether the stream is finished (`done`), whether this poll had nothing ready yet (`skipped`), and, when there is one, the decoded chunk (`data`). The `data` is decoded according to the handle's [encoding](#streamencoding): `'text'` yields a `string`, `'binary'` yields a `Uint8Array`, and `'json'` yields the parsed object.

```typescript
import { askFileStreamOpen, askStreamRead, askStreamClose } from '@qpqjs/core';

export function* askReadWholeFile(filepath: string) {
  const handle = yield* askFileStreamOpen('logs', filepath, 'text');

  let contents = '';
  while (true) {
    const chunk = yield* askStreamRead(handle);
    if (chunk.done) {
      break;
    }
    if (chunk.data) {
      contents += chunk.data;
    }
  }

  yield* askStreamClose(handle);
  return contents;
}
```

For most cases you don't need to write this loop yourself — reach for [askStreamProcess](./ask-stream-process.md) or [askStreamMap](./ask-stream-map.md), which wrap read + close.

## Signature

```typescript
function* askStreamRead<E extends StreamEncoding, T = unknown>(
  handle: StreamHandle<E, T>,
  noWait?: boolean,
): AskResponse<StreamChunk<StreamDataType<E, T>>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `handle` | `StreamHandle<E, T>` | The handle returned by the action that opened the stream. Its `encoding` (`E`) determines how each chunk's `data` is decoded. |
| `noWait` | `boolean` | When `true`, poll without blocking: if no chunk is ready yet the call returns immediately with `{ done: false, skipped: true }` instead of waiting for the next chunk. Defaults to `false` (wait for the next chunk). |

## Returns

`StreamChunk<StreamDataType<E, T>>` — one envelope describing this read. Inspect the fields in order:

- `done: true` — the stream is exhausted; stop reading. There is no `data`.
- `skipped: true` — a `noWait` poll found nothing ready this instant; the stream is not finished, so try again. There is no `data`.
- otherwise — `data` holds the next decoded chunk.

## Stream value types

These types (all importable from @qpqjs/core) describe a stream and the chunks it produces. They are the shared vocabulary of the whole Stream domain.

### `StreamHandle`

An opaque reference to an open stream. You never construct one — you receive it from an opening action and pass it to `askStreamRead` / `askStreamClose` / `askStreamProcess` / `askStreamMap`.

```typescript
interface StreamHandle<E extends StreamEncoding = StreamEncoding, T = unknown> {
  id: string;
  encoding: E;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Identifies the stream in the runtime's stream registry. |
| `encoding` | `E` | How each chunk is decoded when read — one of the [`StreamEncoding`](#streamencoding) values. |

The `E` and `T` type parameters flow through to reads. A `StreamHandle<'text'>` reads `string` chunks, a `StreamHandle<'binary'>` reads `Uint8Array` chunks, and a `StreamHandle<'json', AiStreamPart>` reads parsed `AiStreamPart` objects.

### `StreamChunk`

The envelope returned by every read.

```typescript
interface StreamChunk<T = unknown> {
  done: boolean;
  skipped?: boolean;
  data?: T;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `done` | `boolean` | `true` once the stream is exhausted. When `true` there is no `data`. |
| `skipped` | `boolean` | Only set on `noWait` polls: `true` means no chunk was ready this instant (the stream is not done — poll again). |
| `data` | `T` | The decoded chunk, present only when `done` and `skipped` are both falsy. |

### `StreamEncoding`

How each raw chunk is decoded as it is read.

```typescript
type StreamEncoding = 'text' | 'binary' | 'json';
```

| Value | Chunk `data` type |
| --- | --- |
| `'text'` | `string` |
| `'binary'` | `Uint8Array` |
| `'json'` | the JSON-parsed value (`T`) |

### `StreamDataType`

A helper type that maps a `StreamEncoding` (and, for `'json'`, the item type `T`) to the concrete type of a chunk's `data`. You rarely name it directly — it is what makes `askStreamRead` return `string`, `Uint8Array`, or `T` depending on the handle.

```typescript
type StreamDataType<E extends StreamEncoding, T = unknown> =
  E extends 'text' ? string :
  E extends 'binary' ? Uint8Array :
  E extends 'json' ? T :
  never;
```

## Notes

- Reads deliver chunks in order, one per call. `askStreamRead` handles the decoding for you — `'binary'` chunks arrive on the wire as base64 and are turned back into a `Uint8Array`, and `'json'` chunks are `JSON.parse`d — so `data` is always the decoded value matching the handle's encoding.
- `skipped` only ever appears when you pass `noWait: true`. In the default blocking mode a read either returns the next chunk or reports `done`.
- Always release the stream with [askStreamClose](./ask-stream-close.md) once you finish, including on early exit. The stream stories do this for you.

## Related

- [askStreamClose](./ask-stream-close.md) — release the handle when you are done.
- [askStreamProcess](./ask-stream-process.md) — run a callback per chunk, then close (wraps read + close).
- [askStreamMap](./ask-stream-map.md) — collect / transform chunks into an array, then close.
- [askFileStreamOpen](../file/ask-file-stream-open.md) — opens a file on a storage drive as a stream.
- [askAiPromptStream](../ai/ask-ai-prompt-stream.md) — opens a model response as a stream of typed events.
