---
title: defineAccountEmailReceiving
description: The account's one active SES receipt rule set, shared by every app that receives email.
---

# defineAccountEmailReceiving

Declares the account's **SES receipt rule set** and makes it the active one. It is an account setting: declared once in `account.qpq.ts`, deployed by the `qpq-account` stack, and shared by every app's [`defineEmailReceiver`](../webserver/email-receiver.md) in that account and region.

SES allows exactly one active rule set per account per region, which is why it cannot belong to an app. Each app's inf stack adds its own rule (matched on that app's receiving domain) to this set and never activates anything itself.

- **On AWS:** creates a `ReceiptRuleSet` named `qpq-email-receiving` (fixed by the deploy package) and calls `SetActiveReceiptRuleSet` on it through a custom resource (CloudFormation can create a set but not activate one). Deleting the stack deactivates it first, since SES refuses to delete an active set. Nothing receives until this is deployed.

```typescript
import { defineAccountEmailReceiving } from 'quidproquo-config-aws';

export default [
  defineAccountEmailReceiving(),
];
```

## Signature

```typescript
function defineAccountEmailReceiving(): AccountEmailReceivingQPQConfigSetting;
```

Takes no arguments.

## Related

- [defineEmailReceivingDomain](../webserver/email-receiving-domain.md) — the per-app domain mail is received on (bootstrap).
- [defineEmailReceiver](../webserver/email-receiver.md) — the per-service rule that lands mail in a drive.
