---
title: askReportAppend
description: Append events that happened to a report, from any service that declares it. They are counted on the owner a few seconds later.
---

# askReportAppend

Appends one event or several to a [report](../../../config/features/reports.md). Call it where the thing happens, in any service that declares the report. Nothing about an event is declared ahead: any event type, dimensions and measures inside the limits below are counted, so a view defined next month can read events appended today.

The append publishes the events to the report's FIFO event bus and returns. The owner's queue folds them into the report's month documents a few seconds later, so a read straight after an append may not see them yet.

```typescript
import { askReportAppend } from '@qpqjs/features';

export function* askTemplateRenderRecord(templateKind: string, pages: number, renderMs: number) {
  yield* askReportAppend('docgen', {
    type: 'documentRendered',
    dimensions: { templateKind, outcome: 'ok' },
    measures: { pages, renderMs },
  });
}
```

## Signature

```typescript
function* askReportAppend(reportName: string, events: ReportEvent | ReportEvent[], options?: ReportAppendOptions): AskResponse<void>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `reportName` | `string` | The report, as declared with [defineReports](../../../config/features/reports.md). |
| `events` | `ReportEvent \| ReportEvent[]` | One event or several. They may be of different types. |
| `options` | `ReportAppendOptions` | Optional. |

### `ReportEvent`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `string` | yes | The event type: a letter, then letters, digits, `.`, `_` or `-`, at most 64 characters. |
| `at` | `QpqIsoDateTime` | no | When it happened, in `toISOString` form. Defaults to now. At most 5 minutes ahead of now. |
| `dimensions` | `Record<string, string \| number \| boolean>` | yes | The categories it is counted under, at most 12. Values are compared as text, so `4` and `'4'` are one category. |
| `measures` | `Record<string, number>` | no | Numbers to count with it. Each is summed, and its smallest and largest are kept. |

### `ReportAppendOptions`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `utcOffset` | `UtcOffset` (`±HH:MM`) | no | The offset these events' hours, days and months are counted at, such as the tenant's. Defaults to the report's `utcOffset`. Read with the same offset you append with. |

## Returns

`AskResponse<void>`, once the events are published. They are counted later, on the owner.

## Errors

Throws `Invalid`, with a message that starts `askReportAppend('<name>'):` and names the first problem, when any event is malformed. Nothing is sent. An event is malformed when:

- its type does not fit the pattern above, or it has a field other than `type`, `at`, `dimensions` and `measures`;
- `at` is not an ISO date-time in `toISOString` form, or is more than 5 minutes ahead of now;
- the offset is not `±HH:MM` from `-12:00` to `+14:00` in quarter hours;
- a dimension value is not a string, finite number or boolean, or there are more than 12 dimensions;
- a measure is not a finite number;
- a dimension or measure is named `__proto__`, `constructor` or `prototype`, or has an empty name;
- the whole event is over 2 KB.

A failed send to the bus is not thrown. It is logged at error with the report name, the event types and how many events were lost, and the append returns. A count is a side effect of the thing that happened and must never make it fail.

## Notes

- Dimensions are categories, never identifiers. A user id or an email address used as a dimension would sit in the report's log for its retention period and be readable by anyone who can read the report. Each hour and day keeps at most 200 dimension combinations by default (`maxCellsPerBucket`); further ones are counted in an `other` cell, and a read says so with `truncated`.
- Events are appended under the caller's storage scope. With a scoped report each scope's counts are kept apart, and a read sees only its own scope's.
- Each event type in an append travels as one bus message in its own FIFO group, one per scope and type, so one tenant's events of one type are folded in order by one writer and a busy tenant only holds up its own counts.
- The owner's queue checks every event again, keeps only the event type's `allowedDimensions` when it has them, applies its caps, and drops (with a warning) anything that fails. A message SQS delivers twice is counted once.
- Counts are not billing grade. A failed send loses its events, logged as above.

## Related

- [defineReports](../../../config/features/reports.md): declares the report, its offset, views and per event type settings.
- [askReportRead](./ask-report-read.md): reads views of what was appended.
