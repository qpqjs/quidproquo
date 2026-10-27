---
title: Date/time math helpers
description: Pure helpers that shift an ISO-8601 date-time string by days, months, or years.
---

# Date/time math helpers

A small set of **pure** helper functions for shifting an ISO-8601 date-time string forward (or backward, with a negative amount) by days, months, years, or milliseconds. They are ordinary functions — not stories — so you call them directly, without `yield*`.

Each helper takes an ISO-8601 timestamp string (such as the value returned by [askDateNow](./ask-date-now.md)), parses it with `new Date(...)`, applies the shift, and returns the result as a UTC ISO-8601 string via `Date.prototype.toISOString()`. Because they are deterministic pure functions, they can be used freely inside a story (compute the shift on a timestamp you obtained from [askDateNow](./ask-date-now.md)) or anywhere in plain code.

```typescript
import { askDateNow, addDaysToTDateIso } from '@qpqjs/core';

export function* askSevenDaysFromNow() {
  const now = yield* askDateNow();
  // pure call — no yield*
  return addDaysToTDateIso(now, 7);
}
```

:::note
Pass a negative amount to move backward in time, e.g. `addDaysToTDateIso(now, -7)` returns the timestamp seven days ago. All helpers accept and return a plain `string`; the returned value is always normalised to UTC (`...Z`) by `toISOString()`. The arithmetic itself uses the UTC `Date` accessors, so the result never depends on the server's local timezone or its DST transitions.
:::

## addMillisecondsToTDateIso

Shifts a timestamp by a number of milliseconds.

```typescript
function addMillisecondsToTDateIso(startDate: string, numMilliseconds: number): string;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `startDate` | `string` | The ISO-8601 timestamp to shift from. |
| `numMilliseconds` | `number` | Milliseconds to add (negative to subtract). |

Returns a `string` — the shifted timestamp in UTC ISO-8601 form.

## addDaysToTDateIso

Shifts a timestamp by a number of days.

```typescript
function addDaysToTDateIso(startDate: string, numDays: number): string;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `startDate` | `string` | The ISO-8601 timestamp to shift from. |
| `numDays` | `number` | Days to add (negative to subtract). |

Returns a `string` — the shifted timestamp in UTC ISO-8601 form.

## addMonthsToTDateIso

Shifts a timestamp by a number of calendar months.

```typescript
function addMonthsToTDateIso(startDate: string, numMonths: number): string;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `startDate` | `string` | The ISO-8601 timestamp to shift from. |
| `numMonths` | `number` | Months to add (negative to subtract). |

Returns a `string` — the shifted timestamp in UTC ISO-8601 form. Uses JavaScript's `Date.setUTCMonth`, so day-of-month overflow rolls over: adding one month to `2026-01-31` yields early March, since February has no 31st.

## addYearsToTDateIso

Shifts a timestamp by a number of calendar years.

```typescript
function addYearsToTDateIso(startDate: string, numYears: number): string;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `startDate` | `string` | The ISO-8601 timestamp to shift from. |
| `numYears` | `number` | Years to add (negative to subtract). |

Returns a `string` — the shifted timestamp in UTC ISO-8601 form.

## addDayMonthYearToTDateIso

Shifts a timestamp by a combination of days, months, and years in a single call.

```typescript
function addDayMonthYearToTDateIso(
  startDate: string,
  numDays: number,
  numMonths: number,
  numYears: number,
): string;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `startDate` | `string` | The ISO-8601 timestamp to shift from. |
| `numDays` | `number` | Days to add (negative to subtract). |
| `numMonths` | `number` | Months to add (negative to subtract). |
| `numYears` | `number` | Years to add (negative to subtract). |

Returns a `string` — the shifted timestamp in UTC ISO-8601 form. The shifts are applied in order: days, then months, then years. As with `addMonthsToTDateIso`, month/year shifts follow JavaScript's `Date` rollover rules.

## Related

- [askDateNow](./ask-date-now.md) — produces the ISO-8601 timestamps these helpers operate on.
- [askSecondsElapsedFrom](./ask-seconds-elapsed-from.md) — measure the gap between two timestamps.
- [askGetCurrentEpoch](./ask-get-current-epoch.md) / [askGetCurrentEpochMs](./ask-get-current-epoch-ms.md) — the current time as a numeric epoch.
