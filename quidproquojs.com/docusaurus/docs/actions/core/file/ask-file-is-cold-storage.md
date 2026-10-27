---
title: askFileIsColdStorage
description: Check whether a file on a storage drive is in a cold (archival) tier.
---

# askFileIsColdStorage

Reports whether a file on a [storage drive](../../../config/core/storage-drive.md) currently sits in a **cold** (archival) storage tier. Files in cold tiers cannot be read directly — use this check before a read so you can restore or route around them instead of hitting an `InvalidStorageClass` error.

- **Action type:** `FileActionType.IsColdStorage`
- **On AWS:** reads the object's S3 storage class (via `HeadObject`) and returns `true` when it is an archival class such as Glacier or Glacier Deep Archive.

```typescript
import { askFileIsColdStorage, askFileReadTextContents } from '@qpqjs/core';

export function* askReadArchivableReport(filepath: string) {
  const isCold = yield* askFileIsColdStorage('reports', filepath);

  if (isCold) {
    // File is archived — schedule a restore rather than reading it now.
    return null;
  }

  return yield* askFileReadTextContents('reports', filepath);
}
```

## Signature

```typescript
function* askFileIsColdStorage(
  drive: string,
  filepath: string,
  scope?: string,
): AskResponse<boolean>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive the file lives on — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `filepath` | `string` | Path of the file within the drive, forward-slash delimited. |
| `scope` | `string` | Optional storage-scope segment. When set, the processor checks `{scope}/{filepath}` instead, partitioning the drive (used by tenant/scoped features such as the event-doc `scopeResolver`). Must be a single path segment: no separators, `..`, or null bytes. |

## Returns

`boolean` — `true` if the file is in a cold/archival [storage tier](../../../config/core/storage-drive.md#storagedrivetier), `false` if it is in a directly-readable tier.

## Errors

| Error | Meaning |
| --- | --- |
| `FileIsColdStorageErrorTypeEnum.AccessDenied` | The caller lacks permission to read the file's metadata. |
| `FileIsColdStorageErrorTypeEnum.FileNotFound` | No file exists at the given path. |
| `FileIsColdStorageErrorTypeEnum.DriveNotFound` | No storage drive with that name exists in the deployed config. |
| `FileIsColdStorageErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or the scoped `filepath` is absolute or contains `..` segments or null bytes. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askFileIsColdStorage('reports', 'exports/2020.csv'));

if (outcome.success) {
  const isCold = outcome.result;
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive, its tiers, and lifecycle rules that move files into cold storage.
- [askFileReadTextContents](./ask-file-read-text-contents.md) / [askFileReadBinaryContents](./ask-file-read-binary-contents.md) — reads that fail with `InvalidStorageClass` on cold files.
- [askFileExists](./ask-file-exists.md) — check presence without reading.
