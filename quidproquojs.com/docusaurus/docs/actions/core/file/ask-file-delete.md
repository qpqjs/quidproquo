---
title: askFileDelete
description: Delete one or more files from a storage drive.
---

# askFileDelete

Deletes one or more files from a [storage drive](../../../config/core/storage-drive.md). Deleting a file that does not exist is treated as a success, so this action is safe to call idempotently.

- **Action type:** `FileActionType.Delete`
- **On AWS:** issues a single S3 `DeleteObjects` batch request against the drive's bucket for all of the given paths.

```typescript
import { askFileDelete } from '@qpqjs/core';

export function* askRemoveOldExports() {
  yield* askFileDelete('reports', ['exports/january.csv', 'exports/february.csv']);
}
```

## Signature

```typescript
function* askFileDelete(
  drive: string,
  filepaths: string[],
  scope?: string,
): AskResponse<string[]>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive to delete from — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `filepaths` | `string[]` | The paths of the files to delete within the drive, forward-slash delimited. Pass one path or many in a single call. |
| `scope` | `string` | Optional storage-scope segment. When set, the processor deletes `{scope}/{filepath}` for every path in `filepaths`, partitioning the drive (used by tenant/scoped features such as the event-doc `scopeResolver`). Must be a single path segment: no separators, `..`, or null bytes. |

## Returns

`string[]` — the paths that **failed** to delete. An empty array means every file was deleted (or did not exist to begin with). A non-empty array is a partial failure you may choose to retry.

## Errors

| Error | Meaning |
| --- | --- |
| `FileDeleteErrorTypeEnum.AccessDenied` | The caller lacks permission to delete from this drive (e.g. a foreign drive shared without write access). |
| `FileDeleteErrorTypeEnum.DriveNotFound` | No storage drive with that name exists in the deployed config. |
| `FileDeleteErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or one of the scoped `filepaths` is absolute or contains `..` segments or null bytes. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askFileDelete('reports', ['exports/old.csv']));

if (outcome.success) {
  const failedPaths = outcome.result; // empty if all deleted
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Notes

- If the drive declares an `onEvent.delete` handler in [defineStorageDrive](../../../config/core/storage-drive.md#file-events-onevent), that story is triggered for the deleted files.

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive this action deletes from.
- [askFileExists](./ask-file-exists.md) — check whether a file is present.
- [askFileListDirectory](./ask-file-list-directory.md) — enumerate files before deleting.
- [askFileWriteTextContents](./ask-file-write-text-contents.md) — the write counterpart.
