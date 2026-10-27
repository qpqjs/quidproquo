---
title: askFileGenerateTemporaryUploadSecureUrl
description: Generate a time-limited, signed URL that lets a client upload a file directly to a storage drive.
---

# askFileGenerateTemporaryUploadSecureUrl

Generates a temporary, signed URL that lets a client **upload** a single file directly to a [storage drive](../../../config/core/storage-drive.md). The bytes go straight to storage instead of through your service, which is ideal for large uploads from a browser. The URL grants write access to just that one path and stops working once it expires.

- **Action type:** `FileActionType.GenerateTemporaryUploadSecureUrl`
- **On AWS:** returns a SigV4 presigned S3 `PutObject` URL for the object. The expiry cannot exceed **7 days** — the maximum lifetime of a SigV4 presigned URL. If `contentType` and/or `contentDisposition` are supplied they are bound into the signature, so the upload's `Content-Type` / `Content-Disposition` headers must match, and S3 stores them so later downloads serve the object with the same headers.

```typescript
import { askFileGenerateTemporaryUploadSecureUrl } from '@qpqjs/core';

export function* askGetAvatarUploadUrl(userId: string) {
  // Valid for 15 minutes, pinned to PNG
  const url = yield* askFileGenerateTemporaryUploadSecureUrl(
    'user-uploads',
    `avatars/${userId}.png`,
    15 * 60 * 1000,
    { contentType: 'image/png' },
  );
  return url;
}
```

## Signature

```typescript
function* askFileGenerateTemporaryUploadSecureUrl(
  drive: string,
  filepath: string,
  expirationMs: number,
  advancedOptions?: {
    contentType?: string;
    contentDisposition?: string;
  },
  scope?: string,
): AskResponse<string>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `drive` | `string` | Name of the storage drive to upload to — must match a drive declared with [defineStorageDrive](../../../config/core/storage-drive.md) (or one shared via its `owner` option). |
| `filepath` | `string` | Destination path within the drive the client is allowed to write to, forward-slash delimited. |
| `expirationMs` | `number` | How long the URL stays valid, in milliseconds. Must not exceed 7 days (`604800000` ms). |
| `advancedOptions` | `object` | Optional upload options — see below. |
| `scope` | `string` | Optional storage-scope segment. When set, the signed URL targets `{scope}/{filepath}` instead, partitioning the drive (used by tenant/scoped features such as the event-doc `scopeResolver`). Must be a single path segment: no separators, `..`, or null bytes. |

### `advancedOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `contentType` | `string` | – | Pins the `Content-Type` of the upload into the signature. When set, the client must send a matching `Content-Type` header or the `PUT` is rejected. |
| `contentDisposition` | `string` | – | Pins the `Content-Disposition` of the upload into the signature (e.g. `inline` so a stored PDF previews in an `<iframe>` instead of force-downloading). When set, the client must send a matching `Content-Disposition` header, and S3 stores it so later downloads serve it back. |

## Returns

`string` — a fully-qualified, signed URL a client can `PUT` the file to until it expires.

## Errors

| Error | Meaning |
| --- | --- |
| `FileGenerateTemporaryUploadSecureUrlErrorTypeEnum.ExpirationTooLong` | The requested `expirationMs` exceeds the 7 day maximum for signed URLs. |
| `FileGenerateTemporaryUploadSecureUrlErrorTypeEnum.InvalidScope` | The `scope` is not a valid single path segment (empty, `.`, too long, or contains separators, `..`, `:`, or null bytes), or the scoped `filepath` is absolute or contains `..` segments or null bytes. |

Errors thrown by actions can be caught with `askCatch` from @qpqjs/core. It returns an `EitherActionResult` — `{ success: true, result }` on success, or `{ success: false, error }` on failure:

```typescript
const outcome = yield* askCatch(
  askFileGenerateTemporaryUploadSecureUrl('user-uploads', 'avatars/42.png', 15 * 60 * 1000),
);

if (outcome.success) {
  const url = outcome.result;
} else {
  // outcome.error.errorType / outcome.error.errorText
}
```

## Notes

- For browser uploads, allow the client origin with `defineStorageDriveCorsSettings` (@qpqjs/webserver).
- If the drive declares an `onEvent.create` handler in [defineStorageDrive](../../../config/core/storage-drive.md#file-events-onevent), it fires when the client completes the upload — a convenient hook for post-processing.

## Related

- [defineStorageDrive](../../../config/core/storage-drive.md) — declares the drive the URL uploads into.
- [askFileGenerateTemporarySecureUrl](./ask-file-generate-temporary-secure-url.md) — the download counterpart (signed `GET`).
- [askFileWriteBinaryContents](./ask-file-write-binary-contents.md) — write bytes through your service instead of handing out a URL.
- [askFileWriteTextContents](./ask-file-write-text-contents.md) — server-side text write.
- [askEventDocGenerateAssetUploadUrl](../../features/event-doc/ask-event-doc-generate-asset-upload-url.md) — wraps this to mint an upload URL for a document asset.
