---
title: askFileReadObjectJson
description: Read a JSON file from a storage drive and parse it into a typed object.
---

# askFileReadObjectJson

Reads a file on a [storage drive](../../../config/core/storage-drive.md) and parses its contents as JSON, returning a typed object. This is the read counterpart to [askFileWriteObjectJson](./ask-file-write-object-json.md) — the read and `JSON.parse` happen in a single action.

- **Action type:** `FileActionType.ReadObjectJson`
- **On AWS:** performs an S3 `GetObject` on the drive's bucket and runs `JSON.parse` on the text body.

```typescript
import { askFileReadObjectJson } from '@qpqjs/core';

interface AppSettings {
  theme: string;
  featureFlags: string[];
}

export function* askGetSettings() {
  const settings = yield* askFileReadObjectJson<AppSettings>('config', 'settings.json');
  return settings.theme;
}
```

## Signature

```typescript
function* askFileReadObjectJson<T extends object>(
  drive: string,
  filepath: string,
  scope?: string,
): AskResponse<T>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive to read from — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `filepath` | `string` | Path of the JSON file within the drive, forward-slash delimited. |
| `scope` | `string` | Optional storage-scope segment. When set, the processor reads `{scope}/{filepath}` instead, partitioning the drive (used by tenant/scoped features such as the event-doc `scopeResolver`). Must be a single path segment: no separators, `..`, or null bytes. |

The type parameter `T` is the shape you expect the parsed JSON to have. It is a compile-time annotation only — the contents are not validated against it at runtime.

## Returns

`T` — the parsed JSON object.

## Errors

| Error | Meaning |
| --- | --- |
| `FileReadObjectJsonErrorTypeEnum.InvalidStorageClass` | The file is in a cold storage tier and cannot be read directly. Check first with [askFileIsColdStorage](./ask-file-is-cold-storage.md). |
| `FileReadObjectJsonErrorTypeEnum.FileNotFound` | No file exists at the given `filepath` on the drive. |
| `FileReadObjectJsonErrorTypeEnum.InvalidJson` | The file exists but its contents are not parseable JSON. |
| `FileReadObjectJsonErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or the scoped `filepath` is absolute or contains `..` segments or null bytes. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(askFileReadObjectJson<AppSettings>('config', 'settings.json'));

if (outcome.success) {
  const settings = outcome.result;
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive this action reads from.
- [askFileWriteObjectJson](./ask-file-write-object-json.md) — the write counterpart (`JSON.stringify` + write).
- [askFileReadTextContents](./ask-file-read-text-contents.md) — read the raw string without parsing.
- [askDecodeJson](../json/ask-decode-json.md) — safely parse a JSON string you already have in hand.
