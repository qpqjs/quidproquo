---
title: defineFileUploadSettings
description: Set service-wide limits for multipart/form-data file uploads.
---

# defineFileUploadSettings

Declares **service-wide limits for multipart/form-data file uploads** — maximum file size, file count, field count, field size, and accepted content types. Sensible defaults apply even when this setting is not declared; declare it only to override them.

- **On AWS:** no infrastructure of its own. The limits are enforced by the API Lambda's multipart parser when handling upload requests (see [defineApi](./api.md)). API Gateway independently caps request payloads at 10MB.

```typescript
import { defineFileUploadSettings } from '@qpqjs/webserver';

export default [
  defineFileUploadSettings({
    maxFileSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/*', 'application/pdf'],
  }),
];
```

## Signature

```typescript
function defineFileUploadSettings(
  fileUploadSettings: Partial<FileUploadSettings>,
): FileUploadSettingsQPQWebServerConfigSetting;
```

## Parameters

### `fileUploadSettings` — `Partial<FileUploadSettings>` (required)

Any subset of the limits below; unspecified fields keep their default.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `maxFileSizeBytes` | `number` | `10485760` (10 MB) | Maximum size of any single uploaded file. Uploads with a larger file are rejected with a `413`. The default matches API Gateway's 10MB request cap. |
| `maxFileCount` | `number` | `10` | Maximum number of files in a single multipart request. |
| `maxFieldCount` | `number` | `100` | Maximum number of non-file fields in a single multipart request. |
| `maxFieldSizeBytes` | `number` | `1048576` (1 MB) | Maximum size of any single non-file field value. Larger values are truncated by the parser. |
| `allowedMimeTypes` | `string[]` | – (any) | Content types accepted for uploaded files, e.g. `['image/*', 'application/pdf']` (`type/*` wildcards supported). Omit to accept any content type. |

## Examples

```typescript
import { defineFileUploadSettings } from '@qpqjs/webserver';

export default [
  // Images only, up to 5MB each, at most 3 per request
  defineFileUploadSettings({
    maxFileSizeBytes: 5 * 1024 * 1024,
    maxFileCount: 3,
    allowedMimeTypes: ['image/png', 'image/jpeg'],
  }),
];
```

## Related

- [defineApi](./api.md) — the API whose Lambda enforces these limits.
- [defineRoute](./route.md) — the routes that accept uploads.
