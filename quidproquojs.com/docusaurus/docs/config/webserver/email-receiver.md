---
title: defineEmailReceiver
description: Run a story for every email sent to the app's receiving domain.
---

# defineEmailReceiver

Receives mail sent to **any address** at the app's [receiving domain](./email-receiving-domain.md) and runs `onEmail` once per message with an `EmailReceivedEvent` whose `message` is the parsed `EmailMessage`: who it is from, who it was delivered to, subject, bodies, attachments and the provider's SPF/DKIM verdicts. Like an `HTTPEvent` for a route, the event is all the handler sees; the transport is the receiver's own.

Dynamic inboxes need no configuration: an address is just a local part, so `<inboxId>@inbox.<domain>` works the moment the receiver exists, and mapping an inbox to a tenant is a row in a key-value store keyed on `message.recipients`.

- **On AWS:** adds one receipt rule, named from the app, environment, module and receiver, to the account's rule set ([defineAccountEmailReceiving](../config-aws/account-email-receiving.md)), matching the receiving host of every root with an S3 action into a drive the receiver owns (`email-<name>`). That drive's create handler parses each raw message with [askEmailParse](../../actions/webserver/email/ask-email-parse.md), runs `onEmail` as an inline function, and deletes the object; a message whose handler threw stays until a one-day lifecycle rule sweeps it. The drive's bucket policy lets exactly that rule write and nothing else. Synth fails if the service declares no [receiving domain](./email-receiving-domain.md).
- **On the dev server:** nothing receives mail. Deployed platforms only.

A throwing handler loses that message after the platform's retries. Catch inside the handler to do otherwise.

```typescript
import { defineEmailReceiver } from 'quidproquo-webserver';

export default [
  defineEmailReceiver('support', {
    onEmail: '/entry/email/onSupportEmail::onSupportEmail',
  }),
];
```

The handler:

```typescript
import { AskResponse } from 'quidproquo-core';
import { EmailReceivedEvent, EmailReceivedEventResponse } from 'quidproquo-webserver';

export function* onSupportEmail({ message }: EmailReceivedEvent): AskResponse<EmailReceivedEventResponse> {
  if (message.authentication.dkim !== 'pass') {
    return;
  }

  const [recipient] = message.recipients;
  // resolve the inbox from the recipient, then do the work
}
```

## Signature

```typescript
function defineEmailReceiver(
  name: string,
  options: EmailReceiverOptions,
): QPQConfig;
```

Returns the receiver setting, the inline function registration for `onEmail`, and the receiver's drive, as one config fragment.

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | The receiver's name; part of the rule, drive and function names. |
| `options.onEmail` | `QpqFunctionRuntime` | The story run per message, with an `EmailReceivedEvent` (`{ message: EmailMessage }`) as its only argument. |

## Related

- [askEmailParse](../../actions/webserver/email/ask-email-parse.md) — the `EmailMessage` shape, and parsing a raw message obtained some other way.
- [defineEmailReceivingDomain](./email-receiving-domain.md) — the domain mail is received on (bootstrap and service).
- [defineAccountEmailReceiving](../config-aws/account-email-receiving.md) — the account rule set (account).
