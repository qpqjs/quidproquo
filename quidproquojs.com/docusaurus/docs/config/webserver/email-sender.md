---
title: defineEmailSender
description: Declare that a service sends email from the app's root domains.
---

# defineEmailSender

Declares that the service sends email with [askEmailSendEmail](../../actions/webserver/email/ask-email-send-email.md) from the app's root domains. The sending identity on each root is that root's site root under the app's [domain resolver](../../domains.md) (`development.example.com` with the default shape).

- **On AWS:** creates an SES `EmailIdentity` per root in its Route53 hosted zone (DKIM records land there automatically), and scopes the service role's `ses:SendEmail` / `ses:SendRawEmail` grant to those identities' exact ARNs. `ses:SendRawEmail` is needed for emails with attachments, which are sent as raw MIME. No grant or identity is created for services that declare no `defineEmailSender`.

```typescript
import { defineDns, defineEmailSender } from 'quidproquo-webserver';

export default [
  defineDns('example.com'),
  defineEmailSender(),
];
```

## Signature

```typescript
function defineEmailSender(): EmailSenderQPQWebServerConfigSetting;
```

Takes no arguments; a service declares it once.

## Returns

An `EmailSenderQPQWebServerConfigSetting` config entry. Deploy reads it with `qpqWebServerUtils.getEmailSenderSettings` to create the SES identities and IAM grants.

## Related

- [askEmailSendEmail](../../actions/webserver/email/ask-email-send-email.md) — send email from the identities declared here.
- [defineDns](./dns.md) — the roots the identities are created on.
- [defineEmailSenderAllowList](../config-aws/email-sender-allow-list.md) — recipient addresses allowed while the SES account is in sandbox mode.
