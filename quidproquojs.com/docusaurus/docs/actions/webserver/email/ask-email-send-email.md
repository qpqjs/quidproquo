---
title: askEmailSendEmail
description: Send an email from a domain declared with defineEmailSender.
---

# askEmailSendEmail

Sends an email. The `from` address must be under a domain declared with [defineEmailSender](../../../config/webserver/email-sender.md) — the deploy grants the service's role permission to send only from its own verified identity domains.

- **Action type:** `EmailActionType.SendEmail`
- **On AWS:** sent through **SES v2** (`SendEmailCommand`). `bcc` addresses are only ever placed in the SES `Destination`, never written into a message header, so other recipients can't see them. When `attachments` are provided the message is built as a raw MIME email (multipart/mixed wrapping a multipart/alternative body); otherwise it's sent as SES "Simple" content. While the SES account is in sandbox mode, recipients also need to be listed with [defineEmailSenderAllowList](../../../config/config-aws/email-sender-allow-list.md) and verified in the SES console.

```typescript
import { askEmailSendEmail } from '@qpqjs/webserver';

export function* askSendWelcomeEmail(to: string) {
  const messageId = yield* askEmailSendEmail({
    from: 'noreply@example.com',
    to: [to],
    subject: 'Welcome!',
    bodyText: 'Thanks for signing up.',
    bodyHtml: '<p>Thanks for signing up.</p>',
  });

  return messageId;
}
```

## Signature

```typescript
function* askEmailSendEmail(payload: EmailSendEmailActionPayload): AskResponse<string>;
```

## Parameters

### `payload` — `EmailSendEmailActionPayload` (required)

| Property | Type | Description |
| --- | --- | --- |
| `from` | `string` | Sender address. Must be under a domain declared with `defineEmailSender`. |
| `to` | `string[]` | Recipient addresses. |
| `cc` | `string[]` (optional) | Addresses copied on the message. |
| `bcc` | `string[]` (optional) | Addresses blind-copied on the message. Never written into a message header, on AWS or otherwise. |
| `replyTo` | `string[]` (optional) | Addresses to route replies to. |
| `subject` | `string` | Message subject. |
| `bodyText` | `string` (optional) | Plain-text body. At least one of `bodyText` / `bodyHtml` is required. |
| `bodyHtml` | `string` (optional) | HTML body. At least one of `bodyText` / `bodyHtml` is required. |
| `attachments` | `QPQBinaryData[]` (optional) | Files to attach, each `{ base64Data, filename, mimetype?, contentDisposition? }`. Presence of any attachment switches the message to the raw MIME send path. |

## Returns

`string` — the provider's message id for the sent email (SES's `MessageId`), or `''` if the provider didn't return one.

## Errors

| Error | Meaning |
| --- | --- |
| `EmailSendEmailErrorTypeEnum.MessageRejected` | SES rejected the message content. |
| `EmailSendEmailErrorTypeEnum.SenderNotVerified` | The `from` domain isn't a verified SES identity (AWS `MailFromDomainNotVerifiedException`). |
| `EmailSendEmailErrorTypeEnum.AccountSuspended` | The SES account is suspended (AWS `AccountSuspendedException`). |
| `EmailSendEmailErrorTypeEnum.SendingPaused` | Sending is paused for the account (AWS `SendingPausedException`). |
| `EmailSendEmailErrorTypeEnum.Throttled` | The send rate was exceeded (AWS `TooManyRequestsException`). |
| `EmailSendEmailErrorTypeEnum.LimitExceeded` | A sending limit was exceeded (AWS `LimitExceededException`). |
| `EmailSendEmailErrorTypeEnum.BadRequest` | The request was otherwise invalid (AWS `BadRequestException`). |

Wrap the call in [askCatch](../../../actions/core/system/ask-catch.md) to handle these without unwinding the story:

```typescript
import { askCatch } from '@qpqjs/core';
import { askEmailSendEmail, EmailSendEmailErrorTypeEnum } from '@qpqjs/webserver';

export function* askTrySendEmail(payload) {
  const outcome = yield* askCatch(askEmailSendEmail(payload));
  if (!outcome.success && outcome.error.errorType === EmailSendEmailErrorTypeEnum.Throttled) {
    // back off and retry later
  }
}
```

## Related

- [defineEmailSender](../../../config/webserver/email-sender.md) — declares the verified sending domain this action requires.
- [defineEmailSenderAllowList](../../../config/config-aws/email-sender-allow-list.md) — recipient addresses allowed while the SES account is in sandbox mode.
- [askCatch](../../../actions/core/system/ask-catch.md) — catch the errors above.
