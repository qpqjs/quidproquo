---
title: defineEmailReceivingDomain
description: The app's inbound email domain, verified with the mail provider and MX-routed to it.
---

# defineEmailReceivingDomain

Declares the app's **receiving domain**: `<subdomain>.<env>.<root>` on every root, resolved like every other host through the app's [domain resolver](../../domains.md) (`inbox.development.example.com` with the default shape). It is a bootstrap setting: bootstrap owns the zone, so it owns the records. Every [`defineEmailReceiver`](./email-receiver.md) in the app receives at this domain, at any local part.

- **On AWS:** per root, creates an SES `EmailIdentity` for the receiving host (its DKIM CNAMEs land in the host's zone) and an MX record on it pointing at `inbound-smtp.<region>.amazonaws.com`. SES email receiving is only offered in some regions; the deploy region must be one of them. The identity also lets the app send to its own inboxes while the SES account is in sandbox.

```typescript
import { defineDns, defineEmailReceivingDomain } from 'quidproquo-webserver';

export default [
  defineDns('example.com'),
  defineEmailReceivingDomain('inbox'),
];
```

## Signature

```typescript
function defineEmailReceivingDomain(
  subdomain?: string,
): EmailReceivingDomainQPQWebServerConfigSetting;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `subdomain` | `string` | `'inbox'` | The subdomain under the site root that receives mail. |

## Related

- [defineAccountEmailReceiving](../config-aws/account-email-receiving.md) — the account rule set the app's rules go into.
- [defineEmailReceiver](./email-receiver.md) — where received mail lands.
