---
title: askFileGenerateTemporarySecureUrl
description: Generate a time-limited, signed URL to download a file directly from a storage drive.
---

# askFileGenerateTemporarySecureUrl

Generates a temporary, signed URL that lets a client **download** a single file directly from a [storage drive](../../../config/core/storage-drive.md) without routing the bytes through your service. The URL grants read access to just that one file and stops working once it expires.

- **Action type:** `FileActionType.GenerateTemporarySecureUrl`
- **On AWS:** returns a SigV4 presigned S3 `GetObject` URL for the object. The expiry cannot exceed **7 days** — the maximum lifetime of a SigV4 presigned URL.

```typescript
import { askFileGenerateTemporarySecureUrl } from '@qpqjs/core';

export function* askGetAvatarDownloadUrl(userId: string) {
  // Valid for 5 minutes
  const url = yield* askFileGenerateTemporarySecureUrl('user-uploads', `avatars/${userId}.png`, 5 * 60 * 1000);
  return url;
}
```

## Signature

```typescript
function* askFileGenerateTemporarySecureUrl(
  drive: string,
  filepath: string,
  expirationMs: number,
  scope?: string,
): AskResponse<string>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive the file lives on — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `filepath` | `string` | Path of the file within the drive, forward-slash delimited. |
| `expirationMs` | `number` | How long the URL stays valid, in milliseconds. Must not exceed 7 days (`604800000` ms). |
| `scope` | `string` | Optional storage-scope segment. When set, the signed URL targets `{scope}/{filepath}` instead, partitioning the drive (used by tenant/scoped features such as the event-doc `scopeResolver`). Must be a single path segment: no separators, `..`, or null bytes. |

## Returns

`string` — a fully-qualified, signed URL a client can `GET` to download the file until it expires.

## Errors

| Error | Meaning |
| --- | --- |
| `FileGenerateTemporarySecureUrlErrorTypeEnum.ExpirationTooLong` | The requested `expirationMs` exceeds the 7 day maximum for signed URLs. |
| `FileGenerateTemporarySecureUrlErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or the scoped `filepath` is absolute or contains `..` segments or null bytes. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(
  askFileGenerateTemporarySecureUrl('user-uploads', 'avatars/42.png', 5 * 60 * 1000),
);

if (outcome.success) {
  const url = outcome.result;
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Notes

- The URL is generated from a signature only — it does not verify that the file exists. Requesting a URL for a missing file succeeds, but the `GET` against it will 404.
- For browser downloads, allow the client origin with `defineStorageDriveCorsSettings` (@qpqjs/webserver).

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive the URL points into.
- [askFileGenerateTemporaryUploadSecureUrl](./ask-file-generate-temporary-upload-secure-url.md) — the upload counterpart (signed `PUT`).
- [askFileReadBinaryContents](./ask-file-read-binary-contents.md) — read bytes through your service instead of handing out a URL.
- [askEventDocGenerateAssetDownloadUrl](../../features/event-doc/ask-event-doc-generate-asset-upload-url.md#askeventdocgenerateassetdownloadurl) — wraps this to mint a download URL for a document asset.
