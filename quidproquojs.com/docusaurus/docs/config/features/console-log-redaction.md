---
title: defineConsoleLogRedaction
description: Make askLog redact its console output before it prints, so secrets never reach CloudWatch.
---

# defineConsoleLogRedaction

Replaces the default `askLog` console processors with ones that run the admin log redaction over the message and data first. Everything else about `askLog` is unchanged: the action still lands in the story log, which stores the raw payload and is redacted when the admin viewer reads it.

Add it to any service whose console output reaches a shared log store. On AWS that is every Lambda, since the console is CloudWatch and anyone with CloudWatch read in the account can see it.

```typescript
import { defineConsoleLogRedaction } from '@qpqjs/features';

export default [defineConsoleLogRedaction()];
```

## Signature

```typescript
function defineConsoleLogRedaction(): QPQConfig;
```

## What gets redacted

The same parsers the admin log viewer uses, applied to the one log call:

- Values under known secret property names (`password`, `token`, `authorization`, `cookie`, `apiKey` and the rest), at any depth, including inside JSON held in a string.
- Values under any property name containing `secret` or `token`, such as `client_secret` or `sessionToken`.
- Basic auth credentials, JWTs and secret-looking url fragments found in any string.

Values under sweep keys are also removed wherever else they appear in the same call, so a token in the data is scrubbed from the message too. Password values are blanked in place only, since they are often ordinary words.

For a template literal log (`askLog\`...\``) the interpolated values are redacted before the message is composed, while they still carry their property names.

## Notes

- Only the one log call is visible to the processor. A value marked with `askRedactString` earlier in the story is not known here, so a message that quotes it is scrubbed only if a key or shape parser also catches it. The story log's read-time redaction still removes it there.
- A value that cannot be copied (one holding a function, say) is replaced whole with `##unredactable##`.
- The processors are registered through `defineActionProcessors`, which the runtime applies after the defaults, so no other change is needed to take effect. The dev server picks them up too if the config includes them.

## Related

- [defineAdminSettings](./admin-settings.md)
