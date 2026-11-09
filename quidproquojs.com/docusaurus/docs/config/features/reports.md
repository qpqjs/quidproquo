---
title: defineReports
description: Declare a named report that any service can append events to and read views from, backed by one event-sourced document per month.
---

# defineReports

Declares a **report**: a named place where any service appends events and reads counts back. It returns a `QPQConfig` that you spread into a service's infrastructure default export. Declare it the same way in every service that uses the report; the `owner` option decides which service's deploy creates the resources, and every other service gets references to them.

Events are counted into one [event document](./event-doc.md) per month. The report's views, event settings, offset and financial year are stored in a config global so every service reads the same declaration.

```typescript
import { defineReports } from '@qpqjs/features';

export default [
  ...defineReports('sales', {
    owner: { module: 'api' },
    utcOffset: '+10:00',
    financialYearStartMonth: 7,
  }),
];
```

## What it declares

For a report named `sales`:

| Resource | Name |
| --- | --- |
| Config global | derived from the report name |
| FIFO event bus | `salesReportEvents` |
| Month document store (plus its events and snapshots stores and blob drive) | `salesReports` |
| Dynamic functions registration for the month document | in every service, not only the owner |

The owner's deploy creates the bus, the stores and the drive. The dynamic functions registration is declared in every service because a dynamic function runs in the service that calls it, and every service that reads a view folds the month documents itself.

## Signature

```typescript
function defineReports(reportName: string, options: ReportsOptions): QPQConfig;
```

## Parameters

### `reportName` (required)

Starts with a letter and holds only letters and digits. It becomes part of the resource names, so anything else throws.

### `options` — `ReportsOptions` (required)

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `owner` | `{ module: string }` (cross-module owner) | yes | The service whose deploy creates the stores and the bus. `module` is required. |
| `utcOffset` | `UtcOffset` (`±HH:MM`) | no | The fixed offset hours, days and months are counted in. It never follows daylight saving. From `-12:00` to `+14:00` in quarter hours. Defaults to `+00:00`. |
| `financialYearStartMonth` | `number` | no | Month the financial year starts, 1 to 12. Defaults to 7 (July). |
| `views` | `Record<string, ReportViewDefinition>` | no | Named views over the report's events. |
| `events` | `Record<string, ReportEventSettings>` | no | Per event type settings. |
| `scoped` | `boolean` | no | Month documents partition by the scope each event was appended under. Defaults to `false`. |

## Returns

A `QPQConfig`: the config global, the FIFO event bus, the summary stores and drive from [defineEventDocSummary](./event-doc-summary.md), and the dynamic functions registration.

## Errors

`defineReports` throws at config time, with a message that starts `defineReports('<name>'):`, when the report name is not letters and digits, `utcOffset` is not a valid offset, `financialYearStartMonth` is not an integer from 1 to 12, or a view or event setting is invalid.

## Related

- [defineEventDocSummary](./event-doc-summary.md)
- [defineEventDoc](./event-doc.md)
