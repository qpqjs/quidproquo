---
title: askFileListDirectory
description: List the files under a folder path on a storage drive, one page at a time.
---

# askFileListDirectory

Lists the files under a folder path on a [storage drive](../../../config/core/storage-drive.md). Results are paged — each call returns up to `maxFiles` entries plus a `pageToken` you pass back to fetch the next page.

- **Action type:** `FileActionType.ListDirectory`
- **On AWS:** performs a paged S3 `ListObjectsV2` under the folder prefix on the drive's bucket, stamping each returned entry with the `drive` name.

```typescript
import { askFileListDirectory } from '@qpqjs/core';

export function* askListReportPage(pageToken?: string) {
  const page = yield* askFileListDirectory('reports', 'exports/', 50, pageToken);

  for (const file of page.fileInfos) {
    // file.filepath, file.isDir, ...
  }

  return page.pageToken; // undefined when there are no more pages
}
```

## Signature

```typescript
function* askFileListDirectory(
  drive: string,
  folderPath: string,
  maxFiles?: number,
  pageToken?: string,
  scope?: string,
): AskResponse<DirectoryList>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive to list — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `folderPath` | `string` | The folder prefix to list under, forward-slash delimited, e.g. `'exports/'`. |
| `maxFiles` | `number` | Maximum entries to return in this page. Defaults to `1000`. |
| `pageToken` | `string` | Token returned by a previous call to fetch the next page. Omit for the first page. |
| `scope` | `string` | Optional storage-scope segment. When set, the processor lists under `{scope}/{folderPath}` instead, partitioning the drive (used by tenant/scoped features such as the event-doc `scopeResolver`). Returned `filepath`s are relative to the scope, matching what you would pass back in. Must be a single path segment: no separators, `..`, or null bytes. |

## Returns

`DirectoryList` — a page of results:

```typescript
interface DirectoryList {
  fileInfos: FileInfo[];
  pageToken?: string; // present only when more pages remain
}

interface FileInfo {
  filepath: string;
  drive: string;
  isDir: boolean;
  hashMd5?: string;
}
```

When `pageToken` is `undefined`, the last page has been returned.

## Errors

| Error | Meaning |
| --- | --- |
| `FileListDirectoryErrorTypeEnum.AccessDenied` | The caller lacks permission to list this drive. |
| `FileListDirectoryErrorTypeEnum.DirectoryNotFound` | No directory exists at the given `folderPath`. |
| `FileListDirectoryErrorTypeEnum.NotADirectory` | The `folderPath` points at a file rather than a directory. |
| `FileListDirectoryErrorTypeEnum.DriveNotFound` | No storage drive with that name exists in the deployed config. |
| `FileListDirectoryErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or the scoped `folderPath` is absolute or contains `..` segments or null bytes. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askFileListDirectory('reports', 'exports/'));

if (outcome.success) {
  const page = outcome.result;
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Notes

- To pull **every** page in one call, use `askFileListAllDirectory(drive, folderPath, scope?)` — a companion requester exported from @qpqjs/core that loops internally and returns a flat `FileInfo[]`. Prefer paging with `askFileListDirectory` for large directories.

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive this action lists.
- [askFileExists](./ask-file-exists.md) — check a single path instead of listing.
- [askFileDelete](./ask-file-delete.md) — delete files discovered by a listing.
- [askFileReadTextContents](./ask-file-read-text-contents.md) — read a listed file's contents.
