---
title: defineReports
description: Declare a named report that any service can append events to and read views from, backed by one event-sourced document per month.
---

# defineReports

Declares a **report**: a named place where any service appends the things that happen ([askReportAppend](../../actions/features/reports/ask-report-append.md)) and reads back how many happened over time ([askReportRead](../../actions/features/reports/ask-report-read.md)). Declare it the same way in every service that uses the report; the `owner` option decides which service's deploy creates the resources, and every other service gets references to them.

Each event type's events are counted into one [event document](./event-doc.md) per month per scope, which keeps every event and running totals per hour and per day. Views are read shapes, not stored data, so a view added later reads events appended before it existed. The report's views, event settings, offset and financial year are kept in a config global so every service reads the same declaration.

```typescript
import { defineReports, ReportBucket, ReportPeriod } from '@qpqjs/features';

export default [
  defineReports('sales', {
    owner: { module: 'api' },
    utcOffset: '+10:00',
    scoped: true,
    views: {
      ordersByChannel: { event: 'orderPlaced', period: { period: ReportPeriod.Last7Days }, bucket: ReportBucket.Day, groupBy: 'channel' },
    },
    events: {
      orderPlaced: { retentionMonths: 13 },
    },
  }),
];
```

## What it declares

For a report named `sales`:

| Resource | Name | Where |
| --- | --- | --- |
| Config global | `salesReportsConfig` | every service |
| FIFO event bus | `salesReportEvents` | created by the owner, referenced elsewhere |
| Month document store, with its events and snapshots stores and blob drive | `salesReports` | created by the owner, referenced elsewhere |
| Dynamic functions for the month document's fold | derived from the store name | every service |
| FIFO queue subscribed to the bus, folding events into month documents | `salesReportFold` | the owner only |

The dynamic functions are registered in every service because a dynamic function runs in the service that calls it, and every service that reads a view folds the month documents itself. The queue has one message group per scope and event type, so each month document has exactly one writer.

## Signature

```typescript
function defineReports(reportName: string, options: ReportsOptions): QPQConfig;
```

## Parameters

### `reportName` (required)

Starts with a letter and holds only letters and digits. It becomes part of the resource names, so anything else throws.

### `options` (required): `ReportsOptions`

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `owner` | `{ module: string }` (cross-module owner) | yes | The service whose deploy creates the bus, the stores and the queue. `module` is required. |
| `utcOffset` | `UtcOffset` (`±HH:MM`) | no | The fixed offset hours, days and months are counted at when an append or a read names none. It never follows daylight saving. From `-12:00` to `+14:00` in quarter hours. Defaults to `+00:00`. |
| `financialYearStartMonth` | `number` | no | The month the financial year starts, 1 to 12. Defaults to 7 (July). |
| `views` | `Record<string, ReportViewDefinition>` | no | Named views, read by name with `askReportRead`. A view has the same fields as one passed to `askReportRead` directly; see [askReportRead](../../actions/features/reports/ask-report-read.md). |
| `events` | `Record<string, ReportEventSettings>` | no | Settings per event type. An event type with no entry gets the defaults. |
| `scoped` | `boolean` | no | Month documents partition by the storage scope each event was appended under, and a read sees only its own scope. Defaults to `false`. |

### `ReportEventSettings`

Every cap is a failsafe that ordinary categories never reach.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `retentionMonths` | `number` | none | How many months of this type a comparison may reach back to. Older months read as nothing. |
| `maxCellsPerBucket` | `number` | 200 | Distinct dimension combinations kept per hour or day. Further combinations are counted in an `other` cell. |
| `maxDimensionNames` | `number` | 32 | Distinct dimension names kept per month. An event bringing a new name past it is counted in the `other` cell. |
| `maxMeasureNames` | `number` | 32 | Distinct measure names kept per month. A new name past it is not counted. |
| `allowedDimensions` | `string[]` | none | When set, every other dimension is dropped from this type's events before they are counted. |

## Returns

A `QPQConfig`: the config global, the FIFO event bus, the month document stores and drive from [defineEventDocSummary](./event-doc-summary.md), the dynamic functions registration, and, on the owner, the folding queue.

## Errors

`defineReports` throws at config time, with a message that starts `defineReports('<name>'):`, when the report name is not letters and digits, `utcOffset` is not a valid offset, `financialYearStartMonth` is not a whole number from 1 to 12, or a view or an event setting is invalid. A misspelt option (such as `window` on a view) is refused rather than ignored.

## Related

- [askReportAppend](../../actions/features/reports/ask-report-append.md)
- [askReportRead](../../actions/features/reports/ask-report-read.md)
- [defineEventDocSummary](./event-doc-summary.md)
- [defineEventDoc](./event-doc.md)
