---
title: defineEmailReceiver
description: Land mail sent to the app's receiving domain in a storage drive the service owns.
---

# defineEmailReceiver

Receives mail sent to **any address** at the app's [receiving domain](./email-receiving-domain.md) and writes each message, as one raw MIME object, into a storage drive the service owns. What happens next is the service's: a [file event](../core/storage-drive.md) on the drive, a schedule, a queue. [askEmailParse](../../actions/webserver/email/ask-email-parse.md) turns an object into a message.

Dynamic inboxes need no configuration: an address is just a local part, so `<inboxId>@inbox.<domain>` works the moment the receiver exists, and mapping an inbox to a tenant is a row in a key-value store.

- **On AWS:** adds one receipt rule, named from the app, environment, module and receiver, to the account's rule set ([defineAccountEmailReceiving](../config-aws/account-email-receiving.md)), matching the receiving host of every root with an S3 action into the drive under `keyPrefix`. The drive's bucket policy lets exactly that rule write, and nothing else. Synth fails if the drive is not declared, or is `scoped` (the provider writes bare keys, which a scoped drive refuses to read).
- **On the dev server:** nothing receives mail. Deployed platforms only.

```typescript
import { defineStorageDrive } from 'quidproquo-core';
import { defineEmailReceiver } from 'quidproquo-webserver';

export default [
  defineStorageDrive('mail', {
    // Raw messages are a queue, not storage: expire them once handled.
    lifecycleRules: [{ deleteAfterDays: 7 }],
    onEvent: { create: '/entry/storageDrive/onMail::onCreate' },
  }),
  defineEmailReceiver('support', { storageDriveName: 'mail' }),
];
```

The handler reads the object and parses it:

```typescript
import { askFileReadBinaryContents } from 'quidproquo-core';
import { askEmailParse, StorageDriveEvent } from 'quidproquo-webserver';

export function* onCreate(event: StorageDriveEvent) {
  for (const filepath of event.filePaths) {
    const raw = yield* askFileReadBinaryContents(event.driveName, filepath);
    const message = yield* askEmailParse(raw.base64Data);
    // message.recipients holds the delivered addresses; resolve an inbox from one.
  }
}
```

## Signature

```typescript
function defineEmailReceiver(
  name: string,
  options: EmailReceiverOptions,
): EmailReceiverQPQWebServerConfigSetting;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | | The receiver's name; part of the rule name and the default prefix. |
| `options.storageDriveName` | `string` | | The drive messages land in. Must be declared by the service and must not be `scoped`. |
| `options.keyPrefix` | `string` | `email/<name>/` | Key prefix inside the drive. |

## Related

- [askEmailParse](../../actions/webserver/email/ask-email-parse.md) — a raw object as a message.
- [defineEmailReceivingDomain](./email-receiving-domain.md) — the domain mail is received on (bootstrap).
- [defineAccountEmailReceiving](../config-aws/account-email-receiving.md) — the account rule set (account).
