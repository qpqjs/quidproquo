---
title: defineStorageDriveCorsSettings
description: Set the browser CORS allowed-origins for a core storage drive, so cross-origin frontends can upload to / download from it directly.
---

# defineStorageDriveCorsSettings

Sets the browser **CORS allowed-origins** for a [storage drive](../core/storage-drive.md) declared with `defineStorageDrive`. CORS only matters when a browser talks to the drive's bucket directly — for example a presigned-URL upload or download from your frontend — so this policy lives in the webserver config (a browser concern) and is keyed by the core drive's name rather than sitting on the core `defineStorageDrive`.

- **On AWS:** the drive's S3 bucket is created with a CORS rule whose `AllowedOrigins` come from this setting (`QpqCoreStorageDriveConstruct`, wired by the web-aware deploy). The bucket allows `GET`, `HEAD`, `PUT`, and `POST` from those origins, all request headers, and exposes the `ETag` response header. When no CORS setting is declared for a drive, its allowed origins default to this service's own domain (`https://<domain>` and `https://*.<domain>`), falling back to `['*']` only when the service declares no domain at all.

```typescript
import { defineStorageDrive } from '@qpqjs/core';
import { defineStorageDriveCorsSettings } from '@qpqjs/webserver';

export default [
  defineStorageDrive('uploads'),

  // Let the app frontend upload straight to the drive
  defineStorageDriveCorsSettings('uploads', ['https://app.example.com']),
];
```

## Signature

```typescript
function defineStorageDriveCorsSettings(
  storageDriveName: string,
  allowedOrigins: string[],
  options?: QPQConfigAdvancedStorageDriveCorsSettings,
): StorageDriveCorsSettingsQPQWebServerConfigSetting;
```

## Parameters

### `storageDriveName` — `string` (required)

The name of the [storage drive](../core/storage-drive.md) (as passed to `defineStorageDrive`) this CORS policy applies to. It is also the setting's `uniqueKey`, so a drive has at most one CORS setting.

### `allowedOrigins` — `string[]` (required)

The browser origins allowed to read/write the drive's objects via cross-origin `fetch`/`XHR`. Pass an explicit list (e.g. `['https://app.example.com']`) for cross-domain frontends, or `['*']` to allow any origin. An explicit list here overrides the service-scoped default.

### `options` — `QPQConfigAdvancedStorageDriveCorsSettings` (optional)

| Property | Type | Description |
| --- | --- | --- |
| `deprecated` | `boolean` | Standard advanced-settings flag marking the setting as deprecated. |

## Examples

```typescript
import { defineStorageDrive } from '@qpqjs/core';
import { defineStorageDriveCorsSettings } from '@qpqjs/webserver';

export default [
  defineStorageDrive('uploads'),
  defineStorageDrive('public-assets'),

  // A specific cross-domain frontend may upload/download from 'uploads'
  defineStorageDriveCorsSettings('uploads', ['https://app.example.com']),

  // Serve 'public-assets' to any origin (e.g. cross-origin fonts/images)
  defineStorageDriveCorsSettings('public-assets', ['*']),
];
```

## Related

- [defineStorageDrive](../core/storage-drive.md) — declares the drive this CORS policy applies to.
- [defineWebEntry](./web-entry.md) — has its own `corsAllowedOrigins` for a web entry's served assets (a distinct concern from a drive's object CORS).
- **Browser-direct transfers:** the presigned-URL file actions (`askFileGenerateTemporaryUploadSecureUrl`, `askFileGenerateTemporarySecureUrl` in @qpqjs/core) are what a browser uses to hit the drive directly — this CORS policy is what makes those cross-origin calls succeed.
- **AWS implementation:** `QpqCoreStorageDriveConstruct` (bucket CORS rule) in `@qpqjs/deploy-awscdk`.
