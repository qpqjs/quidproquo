---
title: askCreateTextQpqBinaryData
description: Wrap a text string as QPQBinaryData with a filename and the correct MIME type.
---

# askCreateTextQpqBinaryData

Builds a [`QPQBinaryData`](#qpqbinarydata) value from a plain text string — base64-encoding the UTF-8 bytes and stamping it with a filename and a MIME type derived from the text's format. Use it to turn generated text (JSON, CSV, HTML, Markdown, …) into the portable binary payload that file and network actions expect.

- A small composed story that base64-encodes the text and fills in the `QPQBinaryData` fields. It performs no I/O.

```typescript
import { askCreateTextQpqBinaryData, TextFileType, askFileWriteBinaryContents } from '@qpqjs/core';

export function* askExportReport(rows: object[]) {
  const csv = toCsv(rows); // your own serialiser
  const payload = yield* askCreateTextQpqBinaryData(csv, 'report.csv', TextFileType.Csv);

  yield* askFileWriteBinaryContents('exports', 'reports/latest.csv', payload);
  return payload;
}
```

## Signature

```typescript
function* askCreateTextQpqBinaryData(
  textData: string,
  filename: string,
  fileType: TextFileType,
): AskResponse<QPQBinaryData>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `textData` | `string` | The text to wrap. It is encoded as UTF-8 and then base64-encoded into `base64Data`. |
| `filename` | `string` | The filename to record on the payload (used e.g. for downloads and content disposition). |
| `fileType` | `TextFileType` | The kind of text — selects the `mimetype`. See the table below. |

### `TextFileType`

An enum of supported text formats. Each maps to a MIME type that is stored on the resulting `QPQBinaryData.mimetype`:

| Member | MIME type |
| --- | --- |
| `TextFileType.Json` | `application/json` |
| `TextFileType.Xml` | `application/xml` |
| `TextFileType.PlainText` | `text/plain` |
| `TextFileType.Html` | `text/html` |
| `TextFileType.Css` | `text/css` |
| `TextFileType.JavaScript` | `application/javascript` |
| `TextFileType.Csv` | `text/csv` |
| `TextFileType.Markdown` | `text/markdown` |
| `TextFileType.Yaml` | `application/x-yaml` |
| `TextFileType.Rtf` | `application/rtf` |

## Returns

A [`QPQBinaryData`](#qpqbinarydata) value whose `base64Data` is the base64 of the UTF-8 text, `filename` is the supplied name, and `mimetype` is derived from `fileType`. The optional `contentDisposition` field is left unset.

## QPQBinaryData

`QPQBinaryData` is quidproquo's portable, JSON-safe wrapper for binary content. Because the bytes are held as a base64 **string**, the value can be returned from a story, stored in a key-value store, sent over an event bus or queue, or passed to an HTTP response without any platform-specific `Buffer`/`Blob` type leaking through. It is the shape produced and consumed by the file binary actions.

```typescript
interface QPQBinaryData {
  base64Data: string;
  filename: string;
  mimetype?: string;
  contentDisposition?: string;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `base64Data` | `string` | The content's bytes, base64-encoded. Decode with `Buffer.from(base64Data, 'base64')` (or the browser equivalent) to recover the raw bytes. |
| `filename` | `string` | The logical filename for the content — used when writing to a drive or offering a download. |
| `mimetype` | `string` (optional) | The content's MIME type, e.g. `text/csv` or `image/png`. |
| `contentDisposition` | `string` (optional) | An HTTP `Content-Disposition` value (e.g. `attachment; filename="report.csv"`) for when the payload is served directly to a browser. |

## Related

- [askFileWriteBinaryContents](../file/ask-file-write-binary-contents.md) — write a `QPQBinaryData` payload to a storage drive.
- [askFileReadBinaryContents](../file/ask-file-read-binary-contents.md) — read a file back as `QPQBinaryData`.
