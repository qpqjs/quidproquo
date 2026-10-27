---
title: askLogCreate
description: Write a structured log line at a given log level from within a story.
---

# askLogCreate

Writes a log entry at a specified [log level](#loglevelenum), with a message and optional structured data.

- **Action type:** `LogActionType.Create`
- **On AWS:** the line is written to the function's stdout (`console.log`), formatted as `` `${logLevel}: ${msg}` ``, with any `data` passed through as a second argument. It flows to CloudWatch Logs like any other Lambda output. This is separate from the story's replayable event history — see [askLogDisableEventHistory](./ask-log-disable-event-history.md).

```typescript
import { askLogCreate, LogLevelEnum } from '@qpqjs/core';

export function* askProcessOrder(orderId: string) {
  yield* askLogCreate(LogLevelEnum.Info, 'Processing order', { orderId });
  // ...
}
```

## Signature

```typescript
function* askLogCreate(
  logLevel: LogLevelEnum,
  msg: string,
  data?: any,
): AskResponse<void>;
```

## Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `logLevel` | `LogLevelEnum` | – | Severity of the entry. See [`LogLevelEnum`](#loglevelenum). |
| `msg` | `string` | – | The log message. |
| `data` | `any` | – | Optional structured payload logged alongside the message. Omitted from output entirely when not provided. |

### `LogLevelEnum`

Numeric enum ordered from most to least severe (the value is the number shown before the message).

| Member | Value | Meaning |
| --- | --- | --- |
| `LogLevelEnum.Fatal` | `0` | The application encountered an event or state in which a crucial business function is no longer working — e.g. it cannot reach a critical data store, or every payment system is down so users cannot check out. |
| `LogLevelEnum.Error` | `1` | The application hit an issue preventing one or more functions from working properly, but other paths still work — e.g. one payment provider is unavailable while checkout still succeeds through another. |
| `LogLevelEnum.Warn` | `2` | Something unexpected happened that might disturb a process, but the code can continue — e.g. a parsing error that left a single document unprocessed. |
| `LogLevelEnum.Info` | `3` | The standard level: something happened or the application entered a certain state. Purely informative — e.g. recording which user requested authorization and whether it succeeded. |
| `LogLevelEnum.Debug` | `4` | Diagnostic information for troubleshooting or for verifying behaviour in a test environment. Less granular than `Trace`, but more than you need day to day. |
| `LogLevelEnum.Trace` | `5` | The most fine-grained level, for rare cases needing full visibility into what the application and its third-party libraries are doing. Expect it to be very verbose. |

## Returns

`void` — the story resumes once the entry has been logged.

## Notes

- For interpolated messages where you also want the individual values captured structurally, use [askLogTemplateLiteral](./ask-log-template-literal.md).

## Related

- [askLogTemplateLiteral](./ask-log-template-literal.md) — log an interpolated message as a tagged template.
- [askLogDisableEventHistory](./ask-log-disable-event-history.md) — control whether the story's full action history is persisted.
