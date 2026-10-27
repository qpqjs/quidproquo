---
title: askEventDocAiAttachmentsValidate
description: Validate chat attachments — ensure each assetId is well-formed and resolves to a real asset under the trusted document.
---

# askEventDocAiAttachmentsValidate

Validates the attachments on a chat message before they reach the model. Attachments arrive from the client as bare `assetId`s; this story rejects any id that isn't guid-shaped (which could path-traverse the drive) and any id that doesn't resolve to a real asset under the session's **trusted** `docId`. This is the guard that stops a client pointing the AI at another document's — or another drive's — files.

It runs inside [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md) before the prompt stream starts.

- Built from [askFileExists](../../core/file/ask-file-exists.md) and `askThrowError`.

```typescript
import { askEventDocAiAttachmentsValidate } from '@qpqjs/features';

export function* askGuardAttachments(drive: string, docId: string, attachments) {
  // throws if any attachment is malformed or missing
  yield* askEventDocAiAttachmentsValidate(drive, docId, attachments);
}
```

## Signature

```typescript
function* askEventDocAiAttachmentsValidate(
  docStorageDrive: string,
  docId: string,
  attachments: EventDocAiAttachment[],
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `docStorageDrive` | `string` | The collection's document storage drive — where assets uploaded via the eventDoc asset routes live (not the chat-history drive). |
| `docId` | `string` | The trusted document id the attachments must belong to. Comes from the session context, never the client or model. |
| `attachments` | `EventDocAiAttachment[]` | The attachments to check — each `{ assetId, filename, mediaType }`. Only `assetId` is validated; the asset path is derived as `eventDocAssetPath(docId, assetId)`. |

## Returns

`void` — resolves if every attachment is valid; throws on the first invalid one.

## Errors

The story throws standard core errors (catch with [askCatch](../../core/system/ask-catch.md)):

| Thrown error | When |
| --- | --- |
| `ErrorTypeEnum.Invalid` | An `assetId` is not guid-shaped (only `A–Z`, `a–z`, `0–9`, `-` allowed) — anything with slashes or dots that could traverse the drive. |
| `ErrorTypeEnum.NotFound` | The `assetId` is well-formed but no asset exists at its path under `docId` on the document drive. |

## Notes

- Only the `assetId` is trusted from the client. The drive and file path are derived server-side from the trusted `docId` (via the eventDoc `eventDocAssetPath` helper), so an attachment can never reference another document's or another drive's files.
- `filename` and `mediaType` are display / content-type hints from the uploader; they are not validated here — the bytes are whatever the asset holds.

## Related

- [askEventDocAiProcessSend](./ask-event-doc-ai-process-send.md) — calls this before streaming the reply.
- [askFileExists](../../core/file/ask-file-exists.md) — the underlying existence check.
- [defineEventDocAi](../../../config/features/event-doc-ai.md) — the feature whose chats carry attachments.
