---
title: askReportRead
description: Read a view of a report, counts over a period cut into hours, days, weeks, months or quarters, optionally filtered, grouped and compared with an earlier period.
---

# askReportRead

Answers a view of a [report](../../../config/features/reports.md): how many of an event type happened over a period, cut into hours, days, weeks, months or quarters, optionally filtered, grouped by a dimension and compared with an earlier period. It works in any service that declares the report.

The read adds up totals the report already keeps per hour and per day, from the few month documents the period touches. It never reads the events one by one, so its cost does not grow with how many there were, and a view over events appended before the view existed answers straight away. The answer has the same shape as Kiln's register query answer, so a dashboard widget can draw either.

```typescript
import { askReportRead, ReportBucket, ReportCompare, ReportPeriod } from '@qpqjs/features';

export function* askRendersThisMonthRead() {
  return yield* askReportRead('docgen', {
    event: 'documentRendered',
    period: { period: ReportPeriod.ThisMonth },
    bucket: ReportBucket.Day,
    groupBy: 'templateKind',
    compare: ReportCompare.PreviousPeriod,
  });
}
```

## Signature

```typescript
function* askReportRead(
  reportName: string,
  viewNameOrView: string | ReportViewDefinition,
  options?: ReportReadOptions,
): AskResponse<ReportReadResult>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `reportName` | `string` | The report, as declared with [defineReports](../../../config/features/reports.md). |
| `viewNameOrView` | `string \| ReportViewDefinition` | The name of a view the report declares, or a view built here. |
| `options` | `ReportReadOptions` | Optional. |

### `ReportViewDefinition`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `event` | `string` | yes | The event type to count. |
| `period` | `ReportPeriodRef` | yes | `{ period: ReportPeriod.<name> }`, or a rolling `{ period: ReportPeriod.Last, count, unit }` with `count` from 1 to 366 and `unit` a `ReportPeriodUnit` (`Day`, `Week` or `Month`). |
| `bucket` | `ReportBucket` | no | `Hour`, `Day`, `Week`, `Month` or `Quarter`. `Hour` reads only `Today` or `Yesterday`. Without a bucket the answer has totals and groups but no points over time. |
| `groupBy` | `string` | no | A dimension to split the counts by. |
| `filter` | `Record<string, string \| number \| boolean>` | no | Dimension values an event must have to count. Compared as text. |
| `measure` | `string` | no | The measure the view is about. Groups are ranked by its sum, otherwise by count. |
| `compare` | `ReportCompare` | no | `PreviousPeriod`, `SameDayLastWeek` or `SamePeriodLastYear`. On `Today`, only `PreviousPeriod`. |
| `groupLimit` | `number` | no | Keep the first N groups. |

### Periods

Periods follow Kiln's register query, worked out at the read's offset when it runs:

- `Today`, `Yesterday`.
- `ThisWeek`, `LastWeek`: Monday to Sunday.
- `ThisMonth`, `LastMonth`, `ThisQuarter`, `ThisYear`.
- `Last7Days`, `Last30Days`: today and the 6 or 29 days before it, so the last 7 days on the 8th are the 2nd to the 8th.
- `ThisFinancialYear`, `LastFinancialYear`: starting in the report's `financialYearStartMonth` (July unless it names another).
- `Last`: `count` whole days, Monday weeks or months ending with the current one.

A calendar period includes its days still to come, so "this month" draws the whole month and a chart stops at `now`.

### `ReportReadOptions`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `utcOffset` | `UtcOffset` (`±HH:MM`) | no | The offset to count at, such as the tenant's. Defaults to the report's `utcOffset`. Use the offset the events were appended with. |

## Returns

`AskResponse<ReportReadResult>`:

| Property | Description |
| --- | --- |
| `now` | When the read ran. A line stops here, and a goal measures its progress against it. |
| `period` | The period as resolved: the period it named, `utcOffset`, and its first and last local days, `from` and `to` (`YYYY-MM-DD`, inclusive). |
| `bucket`, `buckets` | With a bucket: every bucket of the period in time order, empty ones and ones still to come at 0, each `{ key, count, sums, mins, maxes }`, plus `series` (one per group value) with a `groupBy`. Keys are the register's: `YYYY-MM-DDTHH:00`, the day, the week's Monday, or the first of the month or of the quarter. |
| `total`, `sums`, `mins`, `maxes` | The whole period's count, and each measure's sum, smallest and largest. |
| `groups`, `groupsTotal` | With a `groupBy`: one `{ value, count, sums, mins, maxes }` per value over the whole period, largest first. `groupsTotal` is there when `groupLimit` cut some off. |
| `comparison` | With `compare`: `{ compare, period, total, sums, mins, maxes, buckets?, groups? }` over the earlier period. Its groups line up with `groups`, value for value; its buckets are the earlier period's own. |
| `truncated` | True when a cap was reached in the period, so some counts are in no series, group or filtered total. |
| `dimensionKeys`, `measureKeys` | The dimension and measure names the period's events carried, for a screen to offer as choices. |

An empty bucket has a count of 0 and no `mins` or `maxes`, rather than a smallest value of 0.

## Errors

Throws `Invalid`, with a message that starts `askReportRead('<name>'):`, for:

- a view name the report does not declare;
- a view built here that fails the checks `defineReports` runs on declared views (an hourly bucket on any period but today or yesterday, for one);
- an offset that is not `±HH:MM`;
- a period or comparison spanning more than 24 months.

## Notes

- **Comparisons** follow the register: the previous period is the one of the same length just before (in whole months for a period of months), the same day last week is 7 days earlier, and the same period last year is 12 months earlier, or 52 weeks for a period of Monday weeks. A period still in progress is compared to the same point: this month to the 9th against last month to the 9th, today against yesterday to the end of the current hour. An earlier period older than the event type's `retentionMonths` reads as nothing, and `comparison.period.beyondRetention` says so.
- **Offsets** are fixed and never follow daylight saving. At `+10:00`, a Sydney summer day's buckets start at 01:00 local.
- **Hours** are kept for the newest event's day and the day before it, enough for today and yesterday.
- **Groups**: an event without the `groupBy` dimension counts in the totals but in no group.
- **Scope**: a read runs in the caller's storage scope and sees only that scope's events.
- **Freshness**: a read sees an event once the owner's queue has folded it, usually seconds after the append. Nothing is pushed to a screen that is already open; poll.

## Related

- [defineReports](../../../config/features/reports.md): declares the report, its offset, its named views and per event type settings.
- [askReportAppend](./ask-report-append.md): appends the events these views count.
