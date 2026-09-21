---
title: askFileWriteTextContents
description: Write a UTF-8 string to a file on a storage drive.
---

# askFileWriteTextContents

Writes a string to a file on a [storage drive](../../../config/core/storage-drive.md), creating the file if it doesn't exist and overwriting it if it does.

- **Action type:** `FileActionType.WriteTextContents`

```typescript
import { askFileWriteTextContents } from 'quidproquo-core';

export function* askSaveReport(reportCsv: string) {
  yield* askFileWriteTextContents('reports', 'exports/monthly.csv', reportCsv);
}
```

## Signature

```typescript
function* askFileWriteTextContents(
  drive: string,
  filepath: string,
  data: string,
  storageDriveAdvancedWriteOptions?: StorageDriveAdvancedWriteOptions,
  scope?: string,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive to write to — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `filepath` | `string` | Destination path within the drive, forward-slash delimited. Parent "directories" are implicit — no need to create them. |
| `data` | `string` | The text content to write. |
| `storageDriveAdvancedWriteOptions` | `StorageDriveAdvancedWriteOptions` | Optional write options — see below. |
| `scope` | `string` | Optional storage-scope segment. When set, the processor writes `{scope}/{filepath}` instead, partitioning the drive (used by tenant/scoped features such as the event-doc `scopeResolver`). Must be a single path segment: no separators, `..`, or null bytes. |

### `StorageDriveAdvancedWriteOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `storageDriveTier` | `StorageDriveTier` | `REGULAR` | The [storage tier](../../../config/core/storage-drive.md#storagedrivetier) to write the file into, e.g. write archives directly to `COLD_STORAGE` without waiting for a lifecycle transition. |

## Returns

`void` — the story resumes once the write has completed.

## Errors

| Error | Meaning |
| --- | --- |
| `FileWriteTextContentsErrorTypeEnum.AccessDenied` | The caller lacks permission to write to this drive (e.g. a foreign drive shared without write access). |
| `FileWriteTextContentsErrorTypeEnum.DriveNotFound` | No storage drive with that name exists in the deployed config. |
| `FileWriteTextContentsErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or the scoped `filepath` is absolute or contains `..` segments or null bytes. |

## Notes

- If the drive declares an `onEvent.create` handler in [defineStorageDrive](../../../config/core/storage-drive.md#file-events-onevent), that story is triggered by this write.
- Every drive is encrypted at rest; `cryptoKeyName` swaps in one of your own `defineCryptoKey`s. Nothing changes at the call site either way.

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive, its tiers, events, and encryption.
- [askFileReadTextContents](./ask-file-read-text-contents.md) — the read counterpart.
- [askFileWriteObjectJson](./ask-file-write-object-json.md) — `JSON.stringify` + write in one action.
- [askFileWriteBinaryContents](./ask-file-write-binary-contents.md) — write raw bytes instead of text.
- [askFileGenerateTemporaryUploadSecureUrl](./ask-file-generate-temporary-upload-secure-url.md) — let a browser upload directly to the drive instead of routing bytes through your service.
- [askFileDelete](./ask-file-delete.md) — remove a file from the drive.
