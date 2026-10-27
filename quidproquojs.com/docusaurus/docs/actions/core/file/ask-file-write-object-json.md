---
title: askFileWriteObjectJson
description: Serialize an object to JSON and write it to a file on a storage drive.
---

# askFileWriteObjectJson

Serializes an object with `JSON.stringify` and writes it to a file on a [storage drive](../../../config/core/storage-drive.md), creating the file if it doesn't exist and overwriting it if it does. This is the write counterpart to [askFileReadObjectJson](./ask-file-read-object-json.md) — the serialize and write happen in a single action.

- **Action type:** `FileActionType.WriteObjectJson`
- **On AWS:** runs `JSON.stringify` on the object and performs an S3 `PutObject` on the drive's bucket. If a `storageDriveTier` is given, the object is written directly into that S3 storage class.

```typescript
import { askFileWriteObjectJson } from '@qpqjs/core';

interface AppSettings {
  theme: string;
  featureFlags: string[];
}

export function* askSaveSettings(settings: AppSettings) {
  yield* askFileWriteObjectJson('config', 'settings.json', settings);
}
```

## Signature

```typescript
function* askFileWriteObjectJson<T extends object>(
  drive: string,
  filepath: string,
  data: T,
  storageDriveAdvancedWriteOptions?: StorageDriveAdvancedWriteOptions,
  scope?: string,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive to write to — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `filepath` | `string` | Destination path within the drive, forward-slash delimited. Parent "directories" are implicit — no need to create them. |
| `data` | `T` | The object to serialize and write. It is stored as `JSON.stringify(data)`. |
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
| `FileWriteObjectJsonErrorTypeEnum.AccessDenied` | The caller lacks permission to write to this drive (e.g. a foreign drive shared without write access). |
| `FileWriteObjectJsonErrorTypeEnum.DriveNotFound` | No storage drive with that name exists in the deployed config. |
| `FileWriteObjectJsonErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or the scoped `filepath` is absolute or contains `..` segments or null bytes. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askFileWriteObjectJson('config', 'settings.json', settings));

if (outcome.success) {
  // written
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Notes

- If the drive declares an `onEvent.create` handler in [defineStorageDrive](../../../config/core/storage-drive.md#file-events-onevent), that story is triggered by this write.

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive, its tiers, events, and encryption.
- [askFileReadObjectJson](./ask-file-read-object-json.md) — the read counterpart (read + `JSON.parse`).
- [askFileWriteTextContents](./ask-file-write-text-contents.md) — write a raw string without serializing.
