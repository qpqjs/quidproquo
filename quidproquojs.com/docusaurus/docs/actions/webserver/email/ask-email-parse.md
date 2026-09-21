---
title: askEmailParse
description: Parse a raw MIME message into addresses, subject, body, attachments and the provider's authentication verdicts.
---

# askEmailParse

Parses a raw MIME message into an `EmailMessage`, the `message` a [defineEmailReceiver](../../../config/webserver/email-receiver.md) hands its `onEmail` inside an `EmailReceivedEvent`. A receiver parses for you; this is for a raw message an app obtained some other way.

- **Action type:** `EmailActionType.Parse`
- **At runtime:** pure on every platform (postal-mime in `quidproquo-actionprocessor-js`); throws `Invalid` when the bytes are not a MIME message.

```typescript
import { askFileReadBinaryContents } from 'quidproquo-core';
import { askEmailParse } from 'quidproquo-webserver';

export function* askHandleMail(drive: string, filepath: string) {
  const raw = yield* askFileReadBinaryContents(drive, filepath);
  const message = yield* askEmailParse(raw.base64Data);

  if (message.authentication.dkim !== 'pass') {
    return;
  }

  const [recipient] = message.recipients;
  // ...
}
```

## Signature

```typescript
function* askEmailParse(
  rawBase64: string,
): AskResponse<EmailMessage>;
```

## Returns

An `EmailMessage`:

| Field | Type | Description |
| --- | --- | --- |
| `recipients` | `string[]` | The addresses the provider delivered to (`Delivered-To` / `X-Original-To`), lower-cased. Key inbox lookups on these; the `to` header can name addresses the app never saw. |
| `from`, `to`, `cc`, `replyTo` | `EmailMessageAddress[]` | Header mailboxes, `{ address, name? }`. Group addresses are flattened to their members. |
| `subject` | `string` | Empty when absent. |
| `text`, `html` | `string?` | The bodies, when present. |
| `messageId`, `date` | `string?` | As sent. |
| `attachments` | `EmailMessageAttachment[]` | `{ filename?, mimeType, base64Data }`. |
| `authentication` | `EmailMessageAuthentication` | `{ spf?, dkim?, dmarc? }`: the raw result token from the provider's `Authentication-Results` header (`pass`, `fail`, `softfail`, `none`, ...). `from` is what the sender claims; these are the only evidence for who sent it. |

## Related

- [defineEmailReceiver](../../../config/webserver/email-receiver.md) — receives mail and calls its handler with this shape.
