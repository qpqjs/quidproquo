---
title: askFileReadBinaryContents
description: Read a file from a storage drive as binary data.
---

# askFileReadBinaryContents

Reads a file on a [storage drive](../../../config/core/storage-drive.md) and returns it as binary data — base64-encoded bytes plus metadata. Use this for non-text files such as images, PDFs, or archives.

- **Action type:** `FileActionType.ReadBinaryContents`
- **On AWS:** performs an S3 `GetObject` on the drive's bucket and returns the body base64-encoded.

```typescript
import { askFileReadBinaryContents } from '@qpqjs/core';

export function* askGetLogo() {
  const logo = yield* askFileReadBinaryContents('assets', 'branding/logo.png');
  // logo.base64Data, logo.filename, logo.mimetype
  return logo;
}
```

## Signature

```typescript
function* askFileReadBinaryContents(
  drive: string,
  filepath: string,
  scope?: string,
): AskResponse<QPQBinaryData>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive to read from — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `filepath` | `string` | Path of the file within the drive, forward-slash delimited. |
| `scope` | `string` | Optional storage-scope segment. When set, the processor reads `{scope}/{filepath}` instead, partitioning the drive (used by tenant/scoped features such as the event-doc `scopeResolver`). Must be a single path segment: no separators, `..`, or null bytes. |

## Returns

`QPQBinaryData` — the file's bytes and metadata:

```typescript
interface QPQBinaryData {
  base64Data: string;
  filename: string;
  mimetype?: string;
  contentDisposition?: string;
}
```

## Errors

| Error | Meaning |
| --- | --- |
| `FileReadBinaryContentsErrorTypeEnum.InvalidStorageClass` | The file is in a cold storage tier and cannot be read directly. Check first with [askFileIsColdStorage](./ask-file-is-cold-storage.md). |
| `FileReadBinaryContentsErrorTypeEnum.FileNotFound` | No file exists at the given path. |
| `FileReadBinaryContentsErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or the scoped `filepath` is absolute or contains `..` segments or null bytes. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askFileReadBinaryContents('assets', 'branding/logo.png'));

if (outcome.success) {
  const data = outcome.result;
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive this action reads from.
- [askFileWriteBinaryContents](./ask-file-write-binary-contents.md) — the write counterpart.
- [askFileReadTextContents](./ask-file-read-text-contents.md) — read as a UTF-8 string instead of bytes.
- [askFileGenerateTemporarySecureUrl](./ask-file-generate-temporary-secure-url.md) — hand a client a download URL instead of routing bytes through your service.
- [askFileStreamOpen](./ask-file-stream-open.md) — stream large files in chunks instead of loading them whole.
- [askCreateTextQpqBinaryData](../binary-data/ask-create-text-qpq-binary-data.md) — build a `QPQBinaryData` payload from a text string.
