---
title: defineEmailReceivingDomain
description: The app's inbound email domain, verified with the mail provider and MX-routed to it.
---

# defineEmailReceivingDomain

Declares the app's **receiving domain**: `<subdomain>.<env>.<root>` on every root, resolved like every other host through the app's [domain resolver](../../domains.md) (`inbox.development.example.com` with the default shape). Every [`defineEmailReceiver`](./email-receiver.md) in the app receives at this domain, at any local part.

Like [`defineDns`](./dns.md), it is declared in two places: in the bootstrap config, whose stack owns the zone and so creates the records, and in every service that declares a receiver, which resolves its rule's recipients from it. Put it next to `defineDns` in the app's shared service define.

- **On AWS:** per root, creates an SES `EmailIdentity` for the receiving host (its DKIM CNAMEs land in the host's zone) and an MX record on it pointing at `inbound-smtp.<region>.amazonaws.com`. SES email receiving is only offered in some regions; the deploy region must be one of them. The identity also lets the app send to its own inboxes while the SES account is in sandbox.

```typescript
// bootstrap.qpq.ts, and the shared service define
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
