---
title: defineEmailSenderAllowList
description: Recipient addresses a service may email while its SES account is still in sandbox mode.
---

# defineEmailSenderAllowList

Declares recipient addresses the service is allowed to email while the SES account is in **sandbox** mode. In sandbox, SES authorises a send against the recipient's identity as well as the sender's, so the exact-ARN send grant needs each recipient identity listed too. The addresses must also be verified identities in the SES console.

This is an AWS-specific concession, not a portable email concept, which is why it lives in `quidproquo-config-aws` beside [defineEmailSender](../webserver/email-sender.md) rather than on that webserver setting. Once the account has SES production access this setting does nothing useful and can be deleted.

```typescript
import { defineEmailSender } from 'quidproquo-webserver';
import { defineEmailSenderAllowList } from 'quidproquo-config-aws';

export default [
  defineEmailSender(),
  defineEmailSenderAllowList(['joe@external.com', 'test@external.com']),
];
```

## Signature

```typescript
function defineEmailSenderAllowList(
  allowedEmailAddresses: string[],
): EmailSenderAllowListQPQConfigSetting;
```

## Parameters

### `allowedEmailAddresses` — `string[]` (required)

Recipient addresses to grant sandbox send access to. Multiple calls are additive.

## Related

- [defineEmailSender](../webserver/email-sender.md) — the sending identities this allow-list extends.
