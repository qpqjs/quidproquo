# Reports: counting things as they happen

**Verdict:** feature
**Status:** proposed (nothing built)
**Branch:** `reports`. Planned from a design conversation with Joe on 6 Nov 2026. No GitHub issue. First consumer is DocGen (the template service), not Kiln.
**Updated:** 9 Nov 2026, after comparing with Kiln's register query on doccypoccy's `harry-kiln-dashboards` branch: time zones, more bucket sizes and the register's period names, an answer shaped like the register query's, comparisons with an earlier period, and a minimum and maximum per measure beside the sum (CloudWatch's statistic set). The month EventDoc is renamed from "period document" to "month document", because "period" now means a view's time range, as it does in the register.

## Summary

DocGen can say what it holds right now but has nothing that says what happened over time: how many documents were rendered today, how many failed this week, how that compares to last month. Kiln has hand built one version of this for its flow ops monitor (a facts store, a daily rollup store and a stream projector) and DocGen would build it again for renders and for anything else a dashboard wants to count.

This plan adds a framework feature, `reports`. A report is declared once by name and owner, identically in every service of the app (`defineReports('docgen', { owner, timeZone, views })`), and any service appends any event to it with `askReportAppend('docgen', event)`. Nothing has to be declared before an event is appended: the module keeps every event as appended, so views can be defined after the data has been collecting. Under the hood: a FIFO event bus the append publishes to, a FIFO queue subscribed to it with one message group per scope and event type so each tenant's event type has exactly one writer, an EventDoc per event type per scope per month holding the events and folding them into hourly and daily cells, counted in the report's time zone and keyed by the event's full set of dimensions, and `askReportRead` which answers a view (a period, a bucket size, an optional group by and filter, and an optional comparison with an earlier period) by merging the few month documents it spans. The answer follows Kiln's register query (its periods, bucket keys, comparisons and `now`), so the dashboard widgets that draw a register can draw a report. Views are read shapes, declared as named presets in config or built ad hoc, never stored data, so a new view over old data needs no backfill. The owner's deploy materialises the stores, queue and consumer; every other service gets references, so appending and reading work from anywhere.

## Vocabulary

- **Report**: the named thing, `docgen`. One per app is the expectation; more are allowed.
- **Event**: one thing that happened, appended to a report: `{ type, at?, dimensions, measures? }`. The **type** is any string (`documentRendered`). **Dimensions** are a flat object of string, number or boolean values, any keys. **Measures** are a flat object of numbers; each cell keeps their sum, their smallest value and their largest. Count is always there. None of these are declared ahead of time.
- **Time zone**: the IANA zone a report counts its hours, days and months in (`Australia/Sydney`). The report declares a default; an append and a read may pass a tenant's own. Every event is stamped with the zone it was appended under, so the fold never asks anything outside the log which day an event fell on.
- **View**: a read shape over one event type: a **period** (`Today`, `ThisWeek`, `ThisMonth`, `Last7Days`, a rolling "last 26 weeks", and the rest of the register's set), an optional **bucket** size (`Hour`, `Day`, `Week`, `Month`, `Quarter`), an optional `groupBy` dimension, an optional dimension `filter`, an optional `measure` the chart is about, and an optional **comparison** with an earlier period (`PreviousPeriod`, `SameDayLastWeek`, `SamePeriodLastYear`). Declared by name on the report, or passed ad hoc to the read.
- **Month document**: the EventDoc holding one event type's events for one scope for one calendar month in the events' time zone, and its folded cells. An implementation word; nothing outside the module names it.

Inside the module the word "event" is overloaded, because an EventDoc log also holds events. The plan keeps "report event" for the public thing and "log event" for the EventDoc's, and the one log event type is `ReportEventsAppended`.

## Background

### What exists

- **Register queries** (`doccypoccy`, `apps/docgen/services/register`): filter, sort, group and aggregate over a register's current rows, in memory, up to 10,000 rows. The right tool for "what is", not for "what happened".
- **Register query dashboard fields** (`doccypoccy`, branch `harry-kiln-dashboards` at `dc970e2d3`, Chris's work of 2 and 3 Nov, not merged into `harry-kiln` as of 9 Nov). Chris's Line, Gauge, RankedList, Feed and Map widgets all read `RegisterQueryAnswer` (`apps/docgen/services/register/x-models/src/query/`). The branch adds:
  - `groupBucket` (`RegisterQueryBucket`: hour, day, Monday week, month, quarter), with each bucket keyed by when it starts in the zone (`register/x-logic/src/registerQuery/registerQueryBucketKey.ts`: `2026-11-02T14:00`, `2026-11-02`, the Monday, the first of the month or quarter).
  - Relative periods (`RegisterQueryPeriod`, including the rolling `{ period: last, count, unit }`), resolved by the server into `periods` with `from`, `to`, `timeZone`, a label and `lastDay`.
  - `compare` (`RegisterQueryCompare`: previous period, same day last week, same period last year), answered as `comparison`, with its groups lined up position by position against the answer's.
  - `groupSort` and `groupLimit` for a top N.
  - The server's `now` on every answer.
  - A time zone per register, with `zonedClockInstant` for daylight saving days.

  It still computes over current rows, so it answers "what is". This plan answers "what happened" in the same shape.
- **Flow ops facts** (`doccypoccy`, `apps/docgen/services/flow`): `FLOW_RUN_FACTS_STORE` (one row per run, time sort keyed), `FLOW_OPS_ROLLUP_STORE` (one row per day of flat counters, written with `KvsUpdateActionType.Increment`) and the projector `entry/kvsStream/flowOps/onFlowRunFactsChange.ts`. This is the pattern this plan generalises. Its comments record two framework gaps it worked around: the KVS `ttlInSeconds` upsert option is a no-op in `@qpqjs/actionprocessor-aws` (`packages/actionprocessor-aws/src/logic/dynamo/putItem.ts` still says so), and queue `concurrency` is dead config on the AWS deploy.
- **askMetricPut** (`packages/core/src/actions/metric`): a count to CloudWatch. Right for operational metrics, wrong for tenant facing numbers: dimensions must be low cardinality, tenants cannot query it, and it sits outside the tenant and permission model.
- **EventDoc** (`packages/features/src/eventDoc`): ordered log per document, conditional append at head, snapshots, a pure fold per view, a summary projector on the events store's stream, server authored batch appends (`askEventDocAppendServerEvents`), get or create by code (`askEventDocGetByCodeOrCreate`), reproject at head under the current snapshot cache key (`askEventDocReprojectHead`). No hard destroy in the framework; Kiln carries one at `packages/exengne/service-utils/src/qpq-features/eventDocDestroy/askEventDocDestroy.ts` under the uplift convention. `defineEventDocSummary` takes no `owner` today.
- **Event buses and queues** (`packages/core/src/config/settings/eventBus/defineEventBus.ts`, `packages/core/src/config/settings/queue/defineQueue.ts`): a bus takes `isFifo` and `owner`; a queue takes `isFifo`, `batchSize` and `eventBusSubscriptions` but no `owner`; a bus message and a queue message both carry `groupId` and `deduplicationId`. A FIFO queue may only subscribe to a FIFO bus (`qpqCoreUtils.assertFifoQueueEventBusSubscriptionsAreValid`). The deploy honours `batchSize` for FIFO sources and omits the batching window, which FIFO sources do not support. A service can publish to a bus owned by another service (DocGen's `ops-alerts` bus, owned by Admin and declared in `defineDocGenService` for every service, is the precedent).
- **Cross module ownership** (`packages/core/src/types/CrossModuleOwner.ts`, `defineServiceSettings`): a store, bus, drive, dynamic functions set or schedule declared with `owner: { module }` is created on that module's deploy and is a reference everywhere else; the owner field alone decides. A KVS stream handler attaches only on the owning service's stack (`QpqApiCoreKeyValueStoreStreamConstruct`). Config that must exist only on the owner, such as a queue, goes under `defineServiceSettings({ [owner.module]: [...] })`. `defineTenant` in `packages/features/src/tenant/config/defineTenant.ts` is the worked example of all of this and is the shape `defineReports` copies.
- **Time zones in the framework**: nothing in `@qpqjs/core` or `@qpqjs/features` converts between an instant and a zone's clock today. The zone helpers this plan needs are new (slice 1).

### Why an EventDoc per month and not a KVS counter per bucket

Both were weighed. A counter row per bucket, incremented from a stream projector, is what the flow ops monitor does and it scales without a single writer. It loses the raw events (no drill down, no rebuild, no later backfill), its increments are not idempotent under redelivery, and it needs the KVS TTL that the framework does not yet write.

An EventDoc keeps the events, folds deterministically, snapshots so reads stay bounded, and gives a cheap idempotency check (the last batch id is in the folded state). Its two costs are one writer per document, which the FIFO message group turns into a feature, and a log that never shrinks, which "one document per event type per month" turns into "destroy old months". The month document is the retention unit. If an event type ever outgrows one writer per tenant, the cells are commutative by construction, so the counter per bucket design is the upgrade path and nothing in the public API changes. (Min and max would need a conditional write per bucket there, not an `ADD`.)

### Why the fold does not depend on views

Joe's requirement: events may be collected before anyone defines a view, and user defined views will come. So the fold cannot be shaped by the views. It cells each bucket by the event's full dimension tuple (every dimension key and value the event carried, in key order). Any view, with any `groupBy` and `filter` over those dimensions, is then a read over cells that already exist: filter the tuples, sum into the `groupBy` value. A view defined a month after the data started works on day one with no replay. The price is cardinality, which the cell cap bounds (below), and which the appender controls by keeping dimensions to categories.

The same goes for bucket size. Only hours and days are stored; weeks, months and quarters are added up from the days at read time, so no view has to choose a bucket before the data arrives.

### Why a bus under the hood and not a queue

A bus between the append and the queue costs the producer nothing and keeps a door open: the module derives the bus name from the report name (`reportEventBusName('docgen')`, the way `eventDocEventsStoreName` derives a store name), so an audit relay, a webhook fan out or a second module can subscribe to the same events later with one `eventBusSubscriptions` entry. The producer only ever calls `askReportAppend`.

### Why the answer looks like the register query's

Kiln's dashboard widgets, the first screens that will draw a report, are written against `RegisterQueryAnswer`. Matching its periods, bucket keys, comparisons and `now` means two things. First, a DocGen route can hand a report to those widgets through a field for field mapping, with no maths in between. Second, someone who picks "this month, by week, against last month" gets the same days whether the widget reads a register or a report.

The framework cannot import an app's types, so it owns its own `ReportReadResult` and copies the register's rules, not its code. The mapping lives in DocGen (slice 5). Display labels ("Week of 26 Oct", "This month, 1 to 30 November") stay in the app too. The bucket keys are the same text the app's own label helpers already read.

## Affected packages

- `@qpqjs/features`: the new `reports` feature (config, models, zone helpers, fold, queue consumer, read, tests). `defineEventDocSummary` gains an `owner` option passed to its three stores and its drive, so a collection can be referenced from a non-owning service; additive.
- `@qpqjs/core`: nothing required for slices 1 to 3. Slice 4 (retention) needs an EventDoc hard destroy, which lands in `@qpqjs/features` as the uplift of Kiln's `askEventDocDestroy`.
- `doccypoccy` (follow-up, other repo): declare the report in `defineDocGenService`, append renders from the template service, a read route, the mapping onto `RegisterQueryAnswer`, a screen. Kiln's dashboard widget and the flow ops rollups come after.

## Approach

### The public surface

```ts
// apps/docgen/packages/service-utils/src/defineDocGenService.ts: declared identically in every service
defineReports('docgen', {
  owner: { module: DocGenServiceEnum.Template },

  // The zone hours, days and months are counted in when an append or a read passes none. Default UTC.
  timeZone: 'Australia/Sydney',

  // Named read shapes. Each names an event type and the dimensions it reads; nothing here has to
  // exist before an event is appended, and a view may be added long after the data started.
  views: {
    rendersByKind: { event: 'documentRendered', period: { period: ReportPeriod.Last7Days }, bucket: ReportBucket.Day, groupBy: 'templateKind' },
    failuresToday: { event: 'documentRendered', period: { period: ReportPeriod.Today }, bucket: ReportBucket.Hour, filter: { outcome: 'failed' }, compare: ReportCompare.PreviousPeriod },
    pagesThisMonth: { event: 'documentRendered', period: { period: ReportPeriod.ThisMonth }, bucket: ReportBucket.Day, filter: { outcome: 'ok' }, measure: 'pages', compare: ReportCompare.SamePeriodLastYear },
    packsLast26Weeks: { event: 'packBuilt', period: { period: ReportPeriod.Last, count: 26, unit: ReportPeriodUnit.Week }, bucket: ReportBucket.Week, groupBy: 'outcome' },
    topTemplateKinds: { event: 'documentRendered', period: { period: ReportPeriod.ThisMonth }, groupBy: 'templateKind', groupLimit: 5, compare: ReportCompare.PreviousPeriod },
  },

  // Optional per event type settings; an event type with no entry gets the defaults.
  events: {
    documentRendered: { retentionMonths: 13 },
  },

  scoped: true,   // month documents partition by the scope carried on each event
}),

// where the thing happens, in any DocGen service; nothing declared ahead of this
yield* askReportAppend(
  'docgen',
  {
    type: 'documentRendered',
    dimensions: { templateKind: 'docx', outcome: 'ok' },
    measures: { pages: 4, renderMs: 812 },
  },
  { timeZone: tenantTimeZone },   // optional; the report's timeZone otherwise
);

// where the chart is drawn, in any DocGen service: a declared view by name, or an ad hoc one
const byKind = yield* askReportRead('docgen', 'rendersByKind', { timeZone: tenantTimeZone });
const adHoc = yield* askReportRead('docgen', {
  event: 'documentRendered',
  period: { period: ReportPeriod.ThisQuarter },
  bucket: ReportBucket.Week,
  groupBy: 'outcome',
  compare: ReportCompare.PreviousPeriod,
});

// for anything else that wants the raw events
defineQueue('auditRelay', { ... }, { isFifo: true, eventBusSubscriptions: [reportEventBusName('docgen')] })
```

`at` defaults to the appending story's `askDateNow`; a caller recording something that happened earlier passes it. The zone is resolved once per append (the option, else the report's `timeZone`, else `UTC`), checked as a zone `Intl.DateTimeFormat` accepts, and stamped on every event in the message, so the fold can bucket each event without asking anything outside the log. Under the hood `askReportAppend` is one `askEventBusSendMessages` to the derived bus with the event type as the message type, `{ scope, events }` as the payload and `${scope}/${type}` as the group id; nothing outside the module needs to know that.

The period set is the register's (`RegisterQueryPeriod`), less the two that look ahead (`Next7Days`, `Next30Days`), because a report counts what has happened: `Today`, `Yesterday`, `ThisWeek`, `LastWeek`, `ThisMonth`, `LastMonth`, `Last7Days`, `Last30Days`, `ThisQuarter`, `ThisYear`, `ThisFinancialYear`, `LastFinancialYear`, and the rolling `{ period: Last, count, unit }` with `ReportPeriodUnit` `Day`, `Week` or `Month`. The comparison set is the register's three (`RegisterQueryCompare`).

What the read returns, for `rendersByKind` on 9 Nov:

```ts
{
  now: '2026-11-09T05:12:40.118Z',    // askDateNow at the read: what a line stops at and a pro rata goal measures from
  period: { period: 'last7Days', timeZone: 'Australia/Sydney', from: '2026-11-03', to: '2026-11-09' },
  bucket: 'day',
  buckets: [
    {
      key: '2026-11-03',
      count: 50,
      sums: { pages: 175, renderMs: 34311 },
      series: { docx: { count: 41, sums: { pages: 163, renderMs: 30211 } }, pdf: { count: 9, sums: { pages: 12, renderMs: 4100 } } },
    },
    {
      key: '2026-11-04',
      count: 2,
      sums: { pages: 3, renderMs: 900 },
      series: { docx: { count: 0, sums: {} }, pdf: { count: 2, sums: { pages: 3, renderMs: 900 } } },
    },
    // ...one per day to 2026-11-09. The totals below count only the two days shown, to keep this short.
  ],
  total: 52,                                     // the whole period: what a gauge or a metric tile reads
  sums: { pages: 178, renderMs: 35211 },
  mins: { pages: 1, renderMs: 212 },             // the smallest single value of each measure in the period
  maxes: { pages: 40, renderMs: 4820 },          // the largest. Buckets, series and groups carry mins and maxes too, left out here to keep this short.
  groups: [                                      // the whole period per groupBy value, largest first: what a ranked list reads
    { value: 'docx', count: 41, sums: { pages: 163, renderMs: 30211 } },
    { value: 'pdf', count: 11, sums: { pages: 15, renderMs: 5000 } },
  ],
  truncated: false,                              // true if any merged document had an `other` cell in the period
  dimensionKeys: ['outcome', 'templateKind'],
  measureKeys: ['pages', 'renderMs'],
}
```

And the comparison a view with `compare` adds beside it, for `pagesThisMonth` on 9 Nov:

```ts
comparison: {
  compare: 'samePeriodLastYear',
  period: { period: 'thisMonth', timeZone: 'Australia/Sydney', from: '2025-11-01', to: '2025-11-09' },   // counted to the same point
  total: 380,
  sums: { pages: 1490, renderMs: 302114 },
  mins: { pages: 1, renderMs: 198 },
  maxes: { pages: 52, renderMs: 6110 },
  buckets: [ /* November 2025 by day, in time order, so buckets[i] reads against the answer's buckets[i] */ ],
}
```

### What `defineReports` emits

Everywhere (the owner field decides create versus reference):

- `defineGlobal(reportConfigGlobal(name), { views, events, scoped, timeZone, financialYearStartMonth })`, so append, consume and read all see one declaration.
- `defineEventBus(reportEventBusName(name), { isFifo: true, owner })`.
- `defineEventDocSummary(reportStoreName(name), { snapshotFunctions, scoped, owner })`: the summary, events and snapshots stores and the drive. On the owner these are created and the events store's stream drives the summary projector; elsewhere they are references the read uses.
- `defineDynamicFunctions(eventDocFunctionsName(reportStoreName(name), REPORT_MONTH_TYPE), runtime, { owner })` for the month definition's fold.

Owner only, under `defineServiceSettings({ [owner.module]: [...] })`:

- `defineQueue(reportQueueName(name), { '*': consumer entry }, { isFifo: true, batchSize: 10, eventBusSubscriptions: [reportEventBusName(name)] })`. Dead letter queue on by default. `concurrency` not set, since the deploy ignores it; FIFO group ordering serialises writers.
- The retention schedule (slice 4).

Returns config only (code standards: `define*` returns config, never spread). The bus and queue are internal: the derived names are the only way to reach them. `timeZone` must be a zone `Intl.DateTimeFormat` accepts; `financialYearStartMonth` is 1 to 12, default 7 (July, the register's `REGISTER_FINANCIAL_YEAR_START_MONTH`). Declared views are checked for shape at definition time:

- `period` is from the enum, and a rolling one has a whole `count` of at least 1 and a unit.
- `bucket` and `compare` are from their enums.
- `Hour` is used only with `Today` or `Yesterday`.
- An hourly comparison is only `PreviousPeriod` on `Today`.
- `SameDayLastWeek` and `SamePeriodLastYear` are not used on `Today` (see "Comparison").
- `filter` is a flat object, `groupBy` and `measure` are strings, and `groupLimit` is a whole number of at least 1.

They cannot be checked against event types, because those are not declared.

### Storage

One EventDoc collection per report, one doc type `ReportMonth`, one document per event type per calendar month in each scope, code `${type}/${yyyy}-${MM}`, name the same. The month is the one the event falls in, in its stamped zone: a render at 23:30 on 31 October in Sydney (12:30Z) belongs to `documentRendered/2026-10`, not November's document. No `defineEventDocRoutes`: nothing appends to a month document except the consumer, which is the Kiln register's "NO ROUTES" pattern. With `scoped: true` every month document lives in the partition of the scope the events were appended under.

One log event type, `ReportEventsAppended`, carrying `{ batchId, events }` with the events exactly as appended, each with its `at` and `timeZone` stamped. A batch is whatever one queue consumer invocation received, so the log holds one log event per batch, not one per report event. The log is the complete record: whatever the fold does with an event, the event itself is kept, which is what makes later views and a later backfill possible.

### The fold

The document view folds every `ReportEventsAppended` into:

```ts
type ReportMonthState = {
  lastBatchId: Nullable<string>;
  newestAt: Nullable<QpqIsoDateTime>;          // the latest event.at folded, never the clock
  newestTimeZone: Nullable<string>;            // that event's zone, which the hourly trim counts days in
  hourly: Record<string, ReportCells>;         // key yyyy-MM-ddTHH:00 in each event's zone; only newestAt's local day and the day before
  daily: Record<string, ReportCells>;          // key yyyy-MM-dd in each event's zone, the month's days
  dimensionKeys: string[];                     // every dimension key seen this month, for the read and for screens
  measureKeys: string[];                       // every measure key seen this month
};
// cell key: the event's dimensions as `k1=v1|k2=v2|...` in key order; `other` once a bucket is at the cap
type ReportCells = Record<
  string,
  {
    count: number;
    sums: Record<string, number>;
    mins: Record<string, number>;    // per measure; a measure no event in the cell carried is absent, never 0
    maxes: Record<string, number>;
  }
>;
```

Rules the fold keeps:

- **Deterministic.** Buckets come from `event.at` read in `event.timeZone`. The hourly trim keeps the local day `newestAt` falls on and the day before it, in `newestTimeZone`, never anything relative to `askDateNow`. Replaying the log gives the same state. The zone travels on the event, so a refold puts every event back in the bucket it was first counted in, even after a tenant's zone changes. The one thing outside the log the fold leans on is the runtime's zone rules (Node's ICU data): a refold on a runtime whose rules for a zone have changed could move an event by an hour, which is accepted.
- **Local keys.** Bucket keys are the register's text (`registerQueryBucketKey`): `2026-11-02T14:00` for an hour, `2026-11-02` for a day, both as read on the zone's clock. When the clocks go back, the repeated hour is one key holding both real hours. When they go forward, the skipped hour has no key. A local day is then 25 or 23 hours long, as a person there expects. Adelaide's and Darwin's half hour offsets need nothing special, because the key is the local clock reading, not a UTC hour.
- **View independent.** The cell key is the event's whole dimension tuple, so nothing about a view is baked in. Weeks, months and quarters are not stored at all.
- **Bounded.** Daily is at most 31 keys. Hourly is at most 48: two local days, with a repeated hour sharing its key. Cells per bucket are bounded by `maxCellsPerBucket` (default 200, per event type in `events`). An event whose tuple would open a cell past the cap lands in a reserved `other` cell, so a dimension that turned out to be high cardinality shows up as a number on the chart rather than a crashed Lambda. In normal use (a handful of cells per bucket) a state is tens of kilobytes. At the full cap in every bucket it would reach a couple of megabytes (79 buckets of 200 cells, each with a count and three numbers per measure), past `EVENT_DOC_SNAPSHOT_INLINE_MAX_BYTES` (300 KB), and the blob spill takes it.
- **Shape checked, not schema checked.** The consumer refuses an event (it is never appended) when:
  - its type is not a short string;
  - its `timeZone` is not one `Intl.DateTimeFormat` accepts;
  - a dimension value is not a string, number or boolean;
  - a measure is not a finite number;
  - it carries more than `maxDimensions` (default 12) dimensions;
  - the whole event serialises past `maxEventBytes` (default 2 KB).

  Everything inside those bounds is appended as is. An event type is not required to have been seen before.
- **Commutative.** Count, sum, min and max only, the same four CloudWatch keeps per data point. Nothing in a cell depends on event order, which is what lets the read merge documents and what makes the counter per bucket design a drop in later. Min and max merge because report events are only ever appended, never taken back: the smallest of two cells' minimums is the minimum of all their events. A measure an event did not carry stays absent from that event's cell, never 0, so it cannot drag a minimum down.

### The bus, the queue and the consumer

**One message group per scope and event type.** `askReportAppend` sets `groupId` to `${scope}/${type}` (scope from `askStorageScopeRead`, `personal` when unscoped) and `deduplicationId` from `askGuidNew`. The scope and the type also travel in the payload, because the consumer runs as the system, not as the appender. The group gives:

- one ordered lane per tenant per event type, one batch in flight at a time, lanes running in parallel;
- a busy tenant backing up its own lane and nobody else's;
- a consumer invocation that only ever holds one lane's messages, so it re-enters one scope and touches at most two month documents (a batch straddling a month boundary).

The FIFO per group ceiling, a few hundred messages a second, is therefore the ceiling per tenant per event type, which is where it should sit.

The consumer entry, `onReportEvents`, for one invocation:

1. Read the scope and type from the first message; every message in a FIFO batch shares the group, and the consumer asserts it rather than trusting it.
2. Drop events that fail the shape check, logging one warning per batch with the count and the reason. Return handled without appending if nothing is left.
3. Group the events by month document (the month `event.at` falls in, read in `event.timeZone`). Under `askStorageScopeProvide(scope)` and the collection's store context, for each month: `askEventDocGetByCodeOrCreate(code, name, systemActor)`. Get or create is not race safe in general, but one FIFO group has one in flight batch, so it is safe here; the comment on the consumer says why.
4. `askEventDocDocumentStateLatest(docId, { consistentRead: true })` and compare `lastBatchId` with this invocation's batch id. Equal means the previous attempt appended and then failed before the message was deleted: skip the append, return handled.
5. `askEventDocAppendServerEvents(docId, [{ type: ReportEventsAppended, data: { batchId, events }, version }], systemActor)`.

The batch id is derived from the sorted queue message ids of the invocation, so a redelivered batch produces the same id. A partial redelivery (SQS redelivering a subset) produces a different id and is appended; the events it carries were already counted. This is the one window where a count can be high, it needs a crash between the append and the delete plus a partial redelivery, and it is logged at warning when `lastBatchId` matches a prefix of the new batch's message ids so it is visible if it ever happens.

### The read

`askReportRead(name, viewNameOrView, options?)`, run under the reader's scope. `options.timeZone` is the zone to count in, else the report's `timeZone`, else `UTC`. DocGen passes the tenant's, the same zone it appends with. A view name resolves through the report's global; an undeclared name throws `ErrorTypeEnum.Invalid` naming it. An ad hoc view gets the same shape checks a declared one gets at definition, at read time. A view naming a dimension no event in the period carried is not an error: it reads as one series of zeros, and `dimensionKeys` on the result says what was there, so a screen can offer the right choices.

1. **Resolve the period** from `askDateNow` in the zone, by the register's rules (`RegisterQueryPeriod`'s comment is the reference, copied, not imported):
   - Weeks start on Monday.
   - "Last N days" counts today as the last of the N, so "last 7 days" on the 8th is the 2nd to the 8th.
   - Calendar periods (this week, this month, this quarter, this year, the financial years) run their whole length, including days still to come.
   - The rolling `{ period: Last, count, unit }` is `count` whole days, weeks or months ending with the current one.
   - The financial year starts on `financialYearStartMonth`.

   The result is `{ from, to }` as inclusive local days.
2. **Work out the month documents** the period touches: one for `ThisMonth`, two for `Last7Days` near a month boundary, twelve for `ThisYear`. A period spanning more than 24 month documents (`REPORT_READ_MAX_MONTHS`) is refused with `ErrorTypeEnum.Invalid`; retention usually bounds it first.
3. **Read each one**: `askEventDocGetByCode` then `askEventDocDocumentStateLatest` (snapshot seeded, so the fold is the gap since the projector last ran). A missing month is an empty month. These reads work from a non-owning service because the stores are cross module references.
4. **Cut into buckets**:
   - `Hour` reads the hourly cells, and is offered only on `Today` and `Yesterday`, which the hourly keys always cover.
   - `Day` reads the daily cells.
   - `Week`, `Month` and `Quarter` add the daily cells up into buckets keyed by their first day (the Monday, the first of the month, the first of the quarter's first month), the same keys `registerQueryBucketKey` writes. A bucket at either end of the period counts only the days inside it, so the first week of "this month by week" may hold only the 1st and 2nd.
   - No `bucket` means no `buckets` on the answer, only the whole period's totals and groups, which is what a gauge or a ranked list wants.
5. **Collapse the cells** in each bucket: parse each cell key back into its dimension tuple, keep the tuples that match `filter`, and fold each into the bucket's `count`, `sums`, `mins` and `maxes` (adding counts and sums, keeping the smallest and largest). With a `groupBy`, also fold it into the bucket's `series` under that tuple's value.
6. **Fill** every bucket of the period, empty ones counted 0, including buckets still to come. An empty bucket has no `mins` or `maxes`, rather than a minimum of 0. As with the register, a chart stops at `now`, which the answer carries, rather than the answer stopping early.
7. **Totals and groups.** Work out `total`, `sums`, `mins` and `maxes` over the whole period. With a `groupBy`, also work out `groups`, one per value over the whole period:
   - ordered by the view's `measure` sum if it names one, else by count, largest first, with ties broken by value;
   - cut to `groupLimit`, with `groupsTotal` saying how many there were.

   A line reads the buckets; a gauge, a metric tile or a ranked list reads these.
8. **Comparison**, when the view names one (below).
9. Return `ReportReadResult`: `{ now, period: { ...periodRef, timeZone, from, to }, bucket?, buckets?, total, sums, mins, maxes, groups?, groupsTotal?, comparison?, truncated, dimensionKeys, measureKeys }`, with `truncated` true if any merged document had an `other` cell in the period.

There is no `lastDay`. The register uses it to tell a daily summary written a day behind from a quiet day. A report's events land within seconds of happening, so a report is always counted to `now`.

A route is not part of the framework slice. DocGen mounts its own under its permission model.

### Comparison

`compare` takes the register's three, with the register's meanings:

- `PreviousPeriod`: the period before, of the same length (today against yesterday, this month against last month, the last 7 days against the 7 before them).
- `SameDayLastWeek`: seven days earlier.
- `SamePeriodLastYear`: a year earlier. A period counted in Monday weeks moves back 52 weeks, so it still starts on a Monday.

The read resolves the earlier period, runs steps 2 to 7 over it, and returns `comparison: { compare, period, total, sums, mins, maxes, buckets?, groups? }`.

- **To the same point.** A period still in progress is compared to the same point in the earlier one, as the register does. For `PreviousPeriod` on `Today`, whatever the bucket, yesterday is counted from the hourly cells through the end of the current hour, so the earlier side can run up to an hour longer than today's. `until` on the comparison's period says where it stopped. Otherwise it is the same number of days into the earlier period, today counted whole, which is how the register compares a Date column. So "this month to the 9th" is set against "last month to the 9th". The comparison's `to` is the last day counted.
- **Not on Today, except by hour.** `SameDayLastWeek` and `SamePeriodLastYear` on `Today` would set part of today against a whole earlier day, because the hourly cells don't reach that far back. They are refused (see open question 5).
- **Lined up.** As in the register, the comparison's groups are the answer's values in the answer's order, with a value the earlier period has nothing for counted 0. Its buckets are the earlier period's own buckets in time order, so `buckets[i]` reads against `comparison.buckets[i]` (hour 9 yesterday beside hour 9 today). The two can differ in length: this month has 30 days, last month 31.
- **Past retention.** An earlier period older than the event type's `retentionMonths` reads as zeros, and its period carries `beyondRetention: true`, so a widget can say "no data for last year" rather than "+100%".
- **Cost.** At most twice the document reads. The 24 month cap applies to each side.

### Retention

A recurring schedule (`defineRecurringSchedule`, monthly, owner only) per report lists month documents whose month is older than the event type's `retentionMonths` and hard destroys each, in every scope. This needs the framework EventDoc destroy, which is Kiln's `askEventDocDestroy` moved up under the uplift convention: events, snapshots, summary row and blobs for one document, with the write path tombstone the Kiln design notes as the framework's job. Until that lands the schedule can be left unmounted and old months simply accumulate; they are small and nothing reads them.

### Custom views (reserved, not built)

A later feature Joe has asked the shape to allow: a view implemented by an app function rather than a declarative read. The EventDoc definition already carries `views: { [name]: { fold } }`, one snapshotted projection per view, and the month definition's tuple cells are one such view. A custom view is a second entry in that map. Two things are reserved now so nothing has to move later:

- **`runtime` on `defineReports`.** Config is data, so a function cannot travel in it. As with `defineEventDoc(functions, runtime, options)`, the app will export its definition from a module through `createReportMonthDefinition({ customViews })` and point `runtime` at it; absent, the framework's default module is used. Slice 1 builds the default module through that same factory so the option is a one line addition.
- **`custom: true` on a view declaration.** `views.<name>: { event, custom: true }` tells the read that the view's state comes from the projection of that name rather than from the cells, and `askReportRead` returns it per month document, merged across the period through the view's optional `merge(a, b)` when it has one.

A custom fold follows the same rules as the built in one, and the docs will say so: pure and deterministic (events only, no clock, nothing read from outside), bounded state (it is a snapshot), and mergeable if it is to be read across months. Unlike the cells, a custom view is view dependent, so adding one covers events from then on until the backfill job (out of scope) reprojects earlier months; the log keeps every event, so nothing is lost by waiting.

Tenant authored functions written in the UI are not this. They would be the sandboxed user script runner, and calling a sandbox from inside the projector is a per event Lambda cost; if ever wanted, they run as a separate batched consumer off the same bus, never as an EventDoc view.

### Slices

Each slice ships on its own and is reviewable alone.

#### Slice 1: the feature and its fold

1. `packages/features/src/reports/models/`:
   - events and settings: `ReportEvent` (as appended), `ReportStoredEvent` (with `at` and `timeZone` stamped), `ReportEventSettings` (retentionMonths, maxCellsPerBucket);
   - views: `ReportViewDefinition`, the register's period, bucket and comparison sets as `ReportPeriod`, `ReportPeriodUnit`, `ReportPeriodRef`, `ReportBucket`, `ReportCompare`, and `ReportResolvedPeriod`;
   - state and answers: `ReportMonthState`, `ReportCells`, `ReportReadResult`, `ReportComparisonResult`;
   - what crosses the bus: `ReportEventsMessage` (scope, type, events);
   - zod schemas for what crosses a bus or a log, including the shape check.
2. `packages/features/src/reports/constants/`:
   - the log event type `ReportLogEventType.EventsAppended` and the doc type `REPORT_MONTH_TYPE`;
   - defaults, including `UTC`, financial year month 7 and `REPORT_READ_MAX_MONTHS` 24;
   - `reportMonthCode(type, at, timeZone)`, `reportBucketKeys(at, timeZone)` (hour and day keys on the zone's clock), `reportCellKey(dimensions)` and `parseReportCellKey`, `reportGroupId(scope, type)`;
   - the derived names `reportEventBusName(name)`, `reportQueueName(name)`, `reportStoreName(name)` and `reportConfigGlobal(name)`, exported so another service can subscribe to the bus or read the store by name.
3. `packages/features/src/reports/logic/zone/`: the zone helpers, on `Intl.DateTimeFormat`:
   - `zonedClockParts(at, timeZone)`: the local year, month, day, hour and weekday from Monday;
   - `zonedClockInstant(day, minutes, timeZone)`, with the register's daylight saving rules (a time the clocks skip lands that much past the gap; a time they repeat is its earlier occurrence);
   - `zonedDayStart(day, timeZone)` and `isReportTimeZone(zone)`.

   They're ported from doccypoccy's `register/x-logic/src/registerQuery/` (`zonedClockInstant.ts`, `zonedDayStart.ts`, `zoneClockParts.ts`) with their tests, because the framework cannot import an app package. The formatter cache is keyed on the zone's canonical name and capped, as Chris's is, so many spellings of one zone cannot grow a warm Lambda's memory.
4. `packages/features/src/reports/definition/createReportMonthDefinition.ts`: a factory over `createEventDocDefinition`. It has one version, whose reducer applies `EventsAppended` per the fold rules above, the cells as its one view, `serverEventTypes: [EventsAppended]`, and a `customViews` parameter accepted but unused for now (see "Custom views"). The framework's default runtime module calls it with none. Pure functions `applyReportEvents(state, events, settings)` and `trimReportHourly(state)` sit beside it, tested directly.
5. `packages/features/src/eventDoc/config/defineEventDocSummary.ts`: add `owner?: CrossModuleOwner` to `EventDocSummaryOptions`, passed to the three `defineKeyValueStore` calls and `defineStorageDrive`. Additive; `defineEventDoc` leaves it unset.
6. `packages/features/src/reports/config/defineReports.ts`: as described under "What `defineReports` emits". Mirrors `defineTenant`'s split between everywhere and `defineServiceSettings({ [owner.module]: ... })`.
7. Tests:
   - **Fold:** determinism (the same events in two batches and in one give one state); the hourly trim keeping the newest event's local day and the day before; cell key order independence (`{a, b}` and `{b, a}` are one cell); the cell cap into `other`; min and max per measure across two batches, with a measure some events lack leaving the minimum alone; `dimensionKeys` and `measureKeys` accumulating.
   - **Zones:** 23:30 on 31 Oct in Sydney landing in October's document and in 31 Oct's daily key; Adelaide's half hour offset; the day the clocks go forward (23 hourly keys) and back (24 keys, one holding two real hours); a refold after a zone change leaving old events in their old buckets; bucket keys equal to the register's for the same instants (a handful of `registerQueryBucketKey` cases copied across).
   - **Config:** `defineReports` emitting a FIFO bus, and a FIFO queue subscribed to it only under the owner's service settings; definition refusing a bad zone, `Hour` on `ThisMonth`, `SameDayLastWeek` on `Today`, and a rolling period with no count.

#### Slice 2: appending and consuming

8. `packages/features/src/reports/logic/askReportAppend.ts`: takes the report name, one event or a list, and an optional `{ timeZone }`. In order:
   - runs the shape check, zone included, so a caller with a malformed event hears about it in its own story, by name;
   - stamps `at` and the resolved zone;
   - reads the scope, derives the bus name and sends one bus message with the type as its message type, the group id and a fresh deduplication id.

   The consumer runs the same check again, because a bus accepts anything. A failed send (`Throttled`, `QueueNotFound`, `AccessDenied`) is logged at error with the report name, the event type and the count of events lost, and then dropped rather than failing the caller: a count is a side effect of the thing that happened, and the error log is how the loss stays visible. Decided by Joe, 6 Nov 2026; the comment says so.
9. `packages/features/src/reports/entry/queueEvent/reportEvents.ts::onReportEvents`: the consumer described above, with `askStorageScopeProvide` and `askEventDocStoreProvide` around the batch.
10. `packages/features/src/reports/logic/reportBatchId.ts`: pure, sorted message ids hashed.
11. Tests:
    - **Consumer (`runStory`):** a mocked latest state showing a matching `lastBatchId` (no append); a fresh document (create then append); a batch straddling a local month boundary (two documents); a batch whose events carry two zones (each folded by its own); a batch of wholly malformed events (no append, warning logged); a message whose group disagrees with its payload (refused).
    - **Append:** `captureRequester` for the message shape, with the zone stamped from the option, then the report, then `UTC`; `runStory` with the send mocked to throw `Throttled` (an error log, no throw, and the caller's story continues).

#### Slice 3: reading

12. `packages/features/src/reports/logic/askReportRead.ts`, with pure helpers:
    - `resolveReportView(config, nameOrView)`;
    - `resolveReportPeriod(now, periodRef, timeZone, financialYearStartMonth)`, `reportComparisonPeriod(period, compare, now)` and `reportPeriodMonths(period)`;
    - `mergeReportCells`, `collapseReportCells(cells, groupBy, filter)`, `rollUpReportBuckets(daily, bucket, period)`, `fillReportBuckets` and `rankReportGroups(groups, measure, limit)`.
13. Tests:
    - **Views:** name resolution and refusal; ad hoc view shape checks.
    - **Periods:** every period resolved at a month boundary and a year boundary in two zones, with the register's own examples as the reference ("last 7 days on the 8th is the 2nd to the 8th"); a financial year starting in July; the 24 month cap refused.
    - **Buckets:** the merge of two months for a 7 day period straddling them; week, month and quarter roll-ups, including part weeks at the period's ends; zero filled gaps, including buckets still to come, with an empty bucket carrying no min or max; mins and maxes merged across two months and under a filter.
    - **Groups:** groupBy with a filter over full tuple cells; a groupBy over a dimension no event carried (one series of zeros); groups ranked by measure and cut to `groupLimit` with `groupsTotal`.
    - **Comparison:** hourly and daily, each to the same point; the comparison's groups lined up with the answer's when a value has nothing earlier; `beyondRetention` set.
    - **Truncation:** `truncated` set when an `other` cell is in the period.
14. Export from `packages/features/src/index.ts`; docs entry in `docs/` describing the feature in the same voice as the EventDoc docs; `breaking-changes.md` untouched (additive).

#### Slice 4: retention

15. Uplift `askEventDocDestroy` from Kiln into `packages/features/src/eventDoc/logic/` with the tombstone on the append path, per the Kiln design's "hard destroy" section. Its own plan when it is picked up; this slice depends on it.
16. `packages/features/src/reports/entry/schedule/reportRetention.ts` and the `defineRecurringSchedule` in the owner-only block, gated on a `retention: true` option until step 15 ships.

#### Slice 5: DocGen (doccypoccy, separate branch)

17. `defineReports('docgen', { owner: { module: DocGenServiceEnum.Template }, timeZone, views, events, scoped: true })` in `apps/docgen/packages/service-utils/src/defineDocGenService.ts`, beside the `ops-alerts` bus, so every service declares it and the template service materialises it. The view declarations live in an app package (`@docgen/constants` or a new `@docgen/reports-config`), never in a service package, per the one way dependency rule in doccypoccy's CLAUDE.md.
18. Template service: `askReportAppend('docgen', ..., { timeZone })` at the two ends of `askTemplateRenderJobProcess` (success with `outcome: ok`, failure with `outcome: failed`) and in the pack build, passing the tenant's zone (open question 4). Dimensions: template kind and outcome. Measures: pages if the PDF step reports it, and render milliseconds.
19. A read route in the template service (or admin, see open questions) that takes a view name or an ad hoc view, checks a permission, and returns `askReportRead` under the tenant's zone. Beside it, a pure `toRegisterQueryAnswer(result)` in a DocGen package maps a `ReportReadResult` onto what Chris's widgets read:
    - `buckets` become `groups` with the bucket key as `value`, for a line;
    - `groups` become `groups`, for a ranked list;
    - `total` becomes `total`, and `sums`, `mins` and `maxes` become `aggregates`, with a Sum, Min and Max per measure and an average as sum over count;
    - `period` becomes `periods[0]`, with `path` set to an instant path (`@at`), so the widget's "written a day behind" rule never applies and a line runs to `now`;
    - `comparison` is mapped the same way;
    - labels are added with the register's `registerQueryBucketLabel`.

    No arithmetic beyond the average. It is written against `RegisterQueryAnswer` as it stands on `harry-kiln-dashboards`, and follows it if that changes before it merges. A first screen draws the declared views through Chris's widgets and offers `dimensionKeys` for ad hoc ones.
20. Later: a `Report` widget kind on Kiln's dashboard view reading through the same route, and replacing the flow ops rollup projector with `askReportAppend` calls at the run lifecycle transitions, keeping `FLOW_RUN_FACTS_STORE` for the watchlist and in flight registry, which are state, not counts.

## Security and compliance

- **The append is open, so the discipline sits with the appender.** Any string can be a dimension value, so a user id or an email address can be appended and will then sit in an append-only log for the retention period and be visible to anyone with read on the report. The feature docs say plainly: dimensions are categories, never identifiers. Two guards the plan adds so this is not only a convention: an optional `events.<type>.allowedDimensions` list which, when set, makes the consumer drop any other key for that type (the closed set is opt in per type, not required), and `maxDimensions` and `maxEventBytes` which keep a free text field from being used as a dimension. Worth raising with whoever owns the ISO 27001 records of processing before the first tenant facing stream, because an open append surface is a new place personal data could land.
- **Tenant scoped.** The message group, the payload, the month documents and the read all carry the scope; the consumer re-enters it exactly as the EventDoc summary projector does. An event appended under one tenant cannot be folded into another's document, and a message whose group and payload disagree is refused.
- **Open bus, closed fold.** Any service with publish rights on the report's bus can append, and any service may subscribe to it by its derived name. Those are deploy permissions to manage like any other. A subscriber other than the module sees raw events, so adding one is a reviewable config change.
- **Bounded cost.** Hourly 48, daily 31, cells capped, events capped in size and dimension count, one append per batch, one read per month document, at most 24 month documents for each side of a read. No path reads a whole tenant, and one tenant's lane cannot starve another's.
- **Retention is a destroy, not an expiry.** Month documents are the unit, so "we keep 13 months of render counts" is a sentence the platform can keep, once slice 4 lands. Until then the honest wording is "retained", the same caveat the Kiln design applies to registers.
- **Audit.** Reads are not audited at the event level because an event is not meant to be a record about a person. The DocGen route that exposes a view decides whether to ledger the read. (Kiln's register query ledgers every read, so a dashboard polling every 20 seconds writes rows all the time it is open; a report route need not copy that.)

## Out of scope

- **Backfill.** Not needed for a new view, because cells are view independent. It is needed only if the fold's own rules change (a different cell cap, a new trim, a changed cell key), or to move a tenant's past events into a new zone. The mechanism already exists in EventDoc: bump the definition's `snapshotCacheKey` so old snapshots become invisible, then `askEventDocReprojectHead` on each month document, which refolds the whole log under the new rules. A small admin job over the month documents in retention is all that is missing, and the log keeps every event as appended so nothing is lost in the meantime.
- **Runtime defined views** (a tenant author saving a declarative view from the UI). Nothing in the fold or the read cares where a view comes from, so this is a definition document and a read that resolves a name through it instead of the config global; the public surface does not change.
- **Custom views** (an app function as a projection). Shape reserved above; built when the first one is wanted, with the backfill job beside it.
- Percentiles, distinct counts, latest value. Count, sum, min and max keep every cell mergeable. Percentiles would come from a histogram measure (a count per range of values, the way CloudWatch keeps a distribution) and distinct counts from a sketch. Both merge, so either can be added when a screen asks for it.
- Alerting on a view ("more than N failures in an hour"). A read on a schedule gets there without new storage.
- Buckets finer than an hour, and periods that look ahead (`Next7Days`, `Next30Days`).
- Display labels for buckets and periods. They are the app's, from the bucket keys.
- Pushing changes to an open screen. A read is current when it is made; Chris's widgets poll (a dashboard every 20 seconds, the wall every 1 to 15 minutes), and that is enough for now.
- Other subscribers to the bus. The bus is the integration point and the plan only claims one subscriber.

## Open questions for Joe

1. **Document unit.** A month per document keeps a 90 day read at four documents and a year at twelve. A week per document would keep each document smaller and make retention finer, at thirteen documents per 90 days and fifty-two per year (over the 24 cap). Month is the proposal; the name "month document" follows the choice.
2. **Owner.** The template service, because the first event type is its own and it already runs a render queue, or the admin service, which owns the `ops-alerts` bus and is where operational screens live. Template is the proposal; the choice only decides which deploy carries the stores, the queue and the consumer, and can change before anything is written.
3. **Default cell cap.** 200 distinct dimension tuples per hour or day bucket per event type. Generous for categories, tight enough that an identifier used as a dimension shows up as `other` within the first hour. Raise or lower before the first stream if you have a feel for the real cardinalities.
4. **Where a DocGen tenant's zone comes from.** DocGen passes a zone on every append and read; the framework only needs it to be the same on both sides. It could be a tenant setting, Kiln's register zone, or one zone for the whole app to start with (`Australia/Sydney`). One zone for the app is the proposal until a tenant outside it signs up. A tenant whose zone later changes keeps its past events in their old buckets until a backfill moves them.
5. **Same hour comparisons further back.** Keeping hourly cells for the newest event's local day and the seven days before it, instead of one day, would allow "today against the same day last week" to the same hour, as the register does on an instant. It multiplies the hourly part of the state by four (192 keys instead of 48). The proposal is one day now, refusing `SameDayLastWeek` on `Today`, and widening it if a dashboard asks.
