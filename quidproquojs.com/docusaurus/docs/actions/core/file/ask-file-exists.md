---
title: askFileExists
description: Check whether a file exists on a storage drive.
---

# askFileExists

Checks whether a file exists on a [storage drive](../../../config/core/storage-drive.md) without reading its contents.

- **Action type:** `FileActionType.Exists`
- **On AWS:** performs an S3 `HeadObject` on the drive's bucket — a metadata lookup, so no file body is transferred.

```typescript
import { askFileExists, askFileWriteTextContents } from '@qpqjs/core';

export function* askEnsureSeedFile() {
  const exists = yield* askFileExists('config', 'seed/defaults.json');

  if (!exists) {
    yield* askFileWriteTextContents('config', 'seed/defaults.json', '{}');
  }
}
```

## Signature

```typescript
function* askFileExists(
  drive: string,
  filepath: string,
  scope?: string,
): AskResponse<boolean>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive to check — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `filepath` | `string` | Path of the file within the drive, forward-slash delimited, e.g. `'uploads/avatar.png'`. |
| `scope` | `string` | Optional storage-scope segment. When set, the processor checks `{scope}/{filepath}` instead, partitioning the drive (used by tenant/scoped features such as the event-doc `scopeResolver`). Must be a single path segment: no separators, `..`, or null bytes. |

## Returns

`boolean` — `true` if a file exists at the path, `false` otherwise.

## Errors

| Error | Meaning |
| --- | --- |
| `FileExistsErrorTypeEnum.AccessDenied` | The caller lacks permission to check existence on this drive. |
| `FileExistsErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or the scoped `filepath` is absolute or contains `..` segments or null bytes. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askFileExists('config', 'seed/defaults.json'));

if (outcome.success) {
  const exists = outcome.result;
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive this action checks.
- [askFileIsColdStorage](./ask-file-is-cold-storage.md) — check whether a file that exists is in a cold (archival) tier before reading it.
- [askFileReadTextContents](./ask-file-read-text-contents.md) — read the file once you know it exists.
- [askFileDelete](./ask-file-delete.md) — remove a file.
