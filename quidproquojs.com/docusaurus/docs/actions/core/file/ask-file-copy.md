---
title: askFileCopy
description: Copy a file to another path, possibly on another drive, without the bytes crossing the story.
---

# askFileCopy

Copies an object to another path, possibly on another storage drive, without the bytes passing through your service. On AWS this is a server-side S3 `CopyObject`; locally it's a filesystem copy plus its metadata sidecar. The stored content type and content disposition travel with the copy.

- **Action type:** `FileActionType.Copy`
- **On AWS:** issues a single S3 `CopyObject` request from the source bucket/key to the target bucket/key.
- **Locally:** copies the file, then best-effort copies its `.qpqmeta.json` sidecar (missing sidecar is not an error).

```typescript
import { askFileCopy } from 'quidproquo-core';

export function* askDuplicateReport() {
  yield* askFileCopy('reports', 'drafts/q1.csv', 'reports', 'published/q1.csv');
}
```

## Signature

```typescript
function* askFileCopy(
  sourceDrive: string,
  sourceFilepath: string,
  targetDrive: string,
  targetFilepath: string,
  scope?: string,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `sourceDrive` | `string` | Name of the storage drive to copy from — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `sourceFilepath` | `string` | Path of the file to copy within `sourceDrive`, forward-slash delimited. |
| `targetDrive` | `string` | Name of the storage drive to copy to. Can be the same as `sourceDrive` or a different one. |
| `targetFilepath` | `string` | Destination path within `targetDrive`. |
| `scope` | `string` | Optional storage-scope segment, applied to **both** sides: the processor copies `{scope}/{sourceFilepath}` to `{scope}/{targetFilepath}`. A copy never crosses a storage scope. Must be a single path segment: no separators, `..`, or null bytes. |

## Returns

`void` — resolves once the copy completes.

## Errors

| Error | Meaning |
| --- | --- |
| `FileCopyErrorTypeEnum.AccessDenied` | The caller lacks permission to read the source or write the target. |
| `FileCopyErrorTypeEnum.DriveNotFound` | The source or target storage drive does not exist. |
| `FileCopyErrorTypeEnum.FileNotFound` | No object exists at `sourceFilepath`. |
| `FileCopyErrorTypeEnum.InvalidScope` | `scope` is not a valid single path segment. |

Errors thrown by actions can be caught with `askCatch` from quidproquo-core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askFileCopy('reports', 'drafts/q1.csv', 'reports', 'published/q1.csv'));

if (!outcome.success) {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drives this action reads from and writes to.
- [askFileDelete](./ask-file-delete.md) — remove files from a drive.
- [askFileExists](./ask-file-exists.md) — check whether a file is present before copying.
- [askEventDocCopyAsset](../../features/event-doc/ask-event-doc-copy-asset.md) — the event-doc feature built on this action.
