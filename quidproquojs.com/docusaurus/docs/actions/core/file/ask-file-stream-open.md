---
title: askFileStreamOpen
description: Open a file on a storage drive as a readable stream and consume it in chunks.
---

# askFileStreamOpen

Opens a file on a [storage drive](../../../config/core/storage-drive.md) as a **stream** and returns a handle you read from chunk by chunk. Use this instead of [askFileReadBinaryContents](./ask-file-read-binary-contents.md) or [askFileReadTextContents](./ask-file-read-text-contents.md) when a file is too large to comfortably load into memory all at once.

- **Action type:** `FileActionType.StreamOpen`
- **On AWS:** performs an S3 `GetObject` and registers the response body as a chunked async iterator in the runtime's stream registry. Each chunk is `chunkSize` bytes (default `65536`).

The action does not return the file's bytes — it returns a **stream handle**. You then pull chunks with `askStreamRead` and release the stream with `askStreamClose` (both from @qpqjs/core).

```typescript
import { askFileStreamOpen, askStreamRead, askStreamClose } from '@qpqjs/core';

export function* askCountLines(filepath: string) {
  const handle = yield* askFileStreamOpen('logs', filepath, 'text');

  let lines = 0;
  while (true) {
    const chunk = yield* askStreamRead(handle);
    if (chunk.done) {
      break;
    }
    if (chunk.data) {
      lines += chunk.data.split('\n').length - 1;
    }
  }

  yield* askStreamClose(handle);
  return lines;
}
```

## Signature

```typescript
function* askFileStreamOpen<E extends StreamEncoding = 'text'>(
  drive: string,
  filepath: string,
  encoding?: E,
  chunkSize?: number,
  scope?: string,
): AskResponse<StreamHandle<E>>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive the file lives on — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `filepath` | `string` | Path of the file within the drive, forward-slash delimited. |
| `encoding` | `StreamEncoding` | How each chunk is decoded when you read it. `'text'` (default) yields `string`, `'binary'` yields `Uint8Array`, `'json'` parses each chunk. |
| `chunkSize` | `number` | Bytes per chunk. Defaults to `65536` (64 KiB) in the AWS runtime. |
| `scope` | `string` | Optional storage-scope segment. When set, the processor opens `{scope}/{filepath}` instead, partitioning the drive (used by tenant/scoped features such as the event-doc `scopeResolver`). Must be a single path segment: no separators, `..`, or null bytes. |

`StreamEncoding` is `'text' | 'binary' | 'json'`.

## Returns

`StreamHandle<E>` — an opaque handle you pass to `askStreamRead` / `askStreamClose`:

```typescript
interface StreamHandle<E extends StreamEncoding> {
  id: string;
  encoding: E;
}
```

The handle's `encoding` type parameter flows through to `askStreamRead`, so a `'text'` stream reads `string` chunks, a `'binary'` stream reads `Uint8Array` chunks, and a `'json'` stream reads parsed objects.

## Errors

| Error | Meaning |
| --- | --- |
| `FileStreamOpenErrorTypeEnum.InvalidStorageClass` | The file is in a cold storage tier and cannot be streamed directly. Check first with [askFileIsColdStorage](./ask-file-is-cold-storage.md). |
| `FileStreamOpenErrorTypeEnum.FileNotFound` | No file exists at the given path. |
| `FileStreamOpenErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or the scoped `filepath` is absolute or contains `..` segments or null bytes. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askFileStreamOpen('logs', 'app/2026-07-07.log', 'text'));

if (outcome.success) {
  const handle = outcome.result;
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Notes

- Always release the stream with `askStreamClose` once you are done — including on early exit — so the runtime can free the underlying source.
- Reading returns a `StreamChunk`: `{ done, data?, skipped? }`. Stop when `done` is `true`.

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive this action streams from.
- [askFileReadBinaryContents](./ask-file-read-binary-contents.md) / [askFileReadTextContents](./ask-file-read-text-contents.md) — read a whole file at once instead of streaming.
- [askStreamRead](../stream/ask-stream-read.md) / [askStreamClose](../stream/ask-stream-close.md) — read chunks from and release the returned handle.
- [askStreamProcess](../stream/ask-stream-process.md) / [askStreamMap](../stream/ask-stream-map.md) — consume the whole stream in one call (run a callback per chunk, or collect into an array).
- [askFileIsColdStorage](./ask-file-is-cold-storage.md) — verify a file is directly readable before streaming.
