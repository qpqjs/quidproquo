# Reports: counting things as they happen

**Verdict:** feature
**Status:** slices 1 and 2 committed (`0672ec91e`, `5075a7183`); slice 3 built (uncommitted, 9 Nov 2026); slices 4 and 5 not started
**Branch:** `reports`. Planned from a design conversation with Joe on 6 Nov 2026. No GitHub issue. First consumer is DocGen (the template service), not Kiln.
**Updated:** 9 Nov 2026, after comparing with Kiln's register query on doccypoccy's `harry-kiln-dashboards` branch: a fixed UTC offset per report (decided 9 Nov: no time zone database, so everything stays pure), more bucket sizes and the register's period names, an answer shaped like the register query's, comparisons with an earlier period, and a minimum and maximum per measure beside the sum (CloudWatch's statistic set). The month EventDoc is renamed from "period document" to "month document", because "period" now means a view's time range, as it does in the register.

## Summary

DocGen can say what it holds right now but has nothing that says what happened over time: how many documents were rendered today, how many failed this week, how that compares to last month. Kiln has hand built one version of this for its flow ops monitor (a facts store, a daily rollup store and a stream projector) and DocGen would build it again for renders and for anything else a dashboard wants to count.

This plan adds a framework feature, `reports`. A report is declared once by name and owner, identically in every service of the app (`defineReports('docgen', { owner, utcOffset, views })`), and any service appends any event to it with `askReportAppend('docgen', event)`. Nothing has to be declared before an event is appended: the module keeps every event as appended, so views can be defined after the data has been collecting. Under the hood: a FIFO event bus the append publishes to, a FIFO queue subscribed to it with one message group per scope and event type so each tenant's event type has exactly one writer, an EventDoc per event type per scope per month holding the events and folding them into hourly and daily cells, counted at the report's fixed UTC offset and keyed by the event's full set of dimensions, and `askReportRead` which answers a view (a period, a bucket size, an optional group by and filter, and an optional comparison with an earlier period) by merging the few month documents it spans. The answer follows Kiln's register query (its periods, bucket keys, comparisons and `now`), so the dashboard widgets that draw a register can draw a report. Views are read shapes, declared as named presets in config or built ad hoc, never stored data, so a new view over old data needs no backfill. The owner's deploy materialises the stores, queue and consumer; every other service gets references, so appending and reading work from anywhere.

## Vocabulary

- **Report**: the named thing, `docgen`. One per app is the expectation; more are allowed.
- **Event**: one thing that happened, appended to a report: `{ type, at?, dimensions, measures? }`. The **type** is any string (`documentRendered`). **Dimensions** are a flat object of string, number or boolean values, any keys. **Measures** are a flat object of numbers; each cell keeps their sum, their smallest value and their largest. Count is always there. None of these are declared ahead of time.
- **UTC offset**: the fixed offset a report counts its hours, days and months at, as `±HH:MM` (`'+10:00'`, `'+09:30'`), typed as core's `UtcOffset`. It never follows daylight saving. The report declares a default; an append and a read may pass a tenant's own. Each event is stored with the offset it was counted at and its local hour, day and month keys already worked out, so the fold only reads keys.
- **View**: a read shape over one event type: a **period** (`Today`, `ThisWeek`, `ThisMonth`, `Last7Days`, a rolling "last 26 weeks", and the rest of the register's set), an optional **bucket** size (`Hour`, `Day`, `Week`, `Month`, `Quarter`), an optional `groupBy` dimension, an optional dimension `filter`, an optional `measure` the chart is about, and an optional **comparison** with an earlier period (`PreviousPeriod`, `SameDayLastWeek`, `SamePeriodLastYear`). Declared by name on the report, or passed ad hoc to the read.
- **Month document**: the EventDoc holding one event type's events for one scope for one calendar month at the events' offset, and its folded cells. An implementation word; nothing outside the module names it.

Inside the module the word "event" is overloaded, because an EventDoc log also holds events. The plan keeps "report event" for the public thing and "log event" for the EventDoc's, and the one log event type is `APPEND_EVENTS` (`ReportMonthEffect.AppendEvents`, an unprefixed `VERB_NOUN` per code standard E2).

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
- **Time zones in the framework**: nothing in `@qpqjs/core` or `@qpqjs/features` converts between an instant and a zone's clock, and nothing will: see "Why a fixed UTC offset and not a time zone". Core gains only the `UtcOffset` type and the pure `getUtcOffsetMinutes` parser.

### Why an EventDoc per month and not a KVS counter per bucket

Both were weighed. A counter row per bucket, incremented from a stream projector, is what the flow ops monitor does and it scales without a single writer. It loses the raw events (no drill down, no rebuild, no later backfill), its increments are not idempotent under redelivery, and it needs the KVS TTL that the framework does not yet write.

An EventDoc keeps the events, folds deterministically, snapshots so reads stay bounded, and gives a cheap idempotency check (the document's last accepted `clientMessageId`s are in the folded state, and each append carries its queue message's id). Its two costs are one writer per document, which the FIFO message group turns into a feature, and a log that never shrinks, which "one document per event type per month" turns into "destroy old months". The month document is the retention unit. If an event type ever outgrows one writer per tenant, the cells are commutative by construction, so the counter per bucket design is the upgrade path and nothing in the public API changes. (Min and max would need a conditional write per bucket there, not an `ADD`.)

### Why the fold does not depend on views

Joe's requirement: events may be collected before anyone defines a view, and user defined views will come. So the fold cannot be shaped by the views. It cells each bucket by the event's full dimension tuple (every dimension key and value the event carried, in key order). Any view, with any `groupBy` and `filter` over those dimensions, is then a read over cells that already exist: filter the tuples, sum into the `groupBy` value. A view defined a month after the data started works on day one with no replay. The price is cardinality, which the cell cap bounds (below), and which the appender controls by keeping dimensions to categories.

The same goes for bucket size. Only hours and days are stored; weeks, months and quarters are added up from the days at read time, so no view has to choose a bucket before the data arrives.

### Why a bus under the hood and not a queue

A bus between the append and the queue costs the producer nothing and keeps a door open: the module derives the bus name from the report name (`reportEventBusName('docgen')`, the way `eventDocEventsStoreName` derives a store name), so an audit relay, a webhook fan out or a second module can subscribe to the same events later with one `eventBusSubscriptions` entry. The producer only ever calls `askReportAppend`.

### Why the answer looks like the register query's

Kiln's dashboard widgets, the first screens that will draw a report, are written against `RegisterQueryAnswer`. Matching its periods, bucket keys, comparisons and `now` means two things. First, a DocGen route can hand a report to those widgets through a field for field mapping, with no maths in between. Second, someone who picks "this month, by week, against last month" gets the same days whether the widget reads a register or a report (exactly so for a zone without daylight saving; see the next section).

The framework cannot import an app's types, so it owns its own `ReportReadResult` and copies the register's rules, not its code. The mapping lives in DocGen (slice 5). Display labels ("Week of 26 Oct", "This month, 1 to 30 November") stay in the app too. The bucket keys are the same text the app's own label helpers already read.

### Why a fixed UTC offset and not a time zone

Decided with Joe, 9 Nov 2026. Working out a local hour from a time zone name needs the runtime's time zone database (`Intl`), which differs between runtimes and changes when a government moves its daylight saving dates. That is input from outside the code, and impure work belongs in an action. The fold cannot yield actions (EventDoc's `foldDocumentState` is a plain function), and config should be pure too. A fixed offset makes all of it plain arithmetic: shift the instant by the offset and read its UTC fields.

The cost is daylight saving. Brisbane (`+10:00`), Perth (`+08:00`) and Darwin (`+09:30`) are exact all year. Sydney, Melbourne, Canberra and Hobart (`+10:00`, `+11:00` in summer) and Adelaide (`+09:30`, `+10:30`) are an hour out half the year: at `+10:00`, a summer day's buckets start at 01:00 local and an hourly chart reads an hour early. Weekly and monthly charts barely move. A register chart (which uses real zones) and a report chart can then put an event from the midnight hour on different days.

The way back is kept open: the consumer stamps each event's local keys before it is stored and the fold only reads keys, so a daylight-saving-correct version would be an action that computes the keys, with no change to the fold, the log format or old events.

## Affected packages

- `@qpqjs/features`: the new `reports` feature (config, models, fold, queue consumer, read, tests). `defineEventDocSummary` gains an `owner` option passed to its three stores and its drive, so a collection can be referenced from a non-owning service; additive.
- `@qpqjs/core`: the `UtcOffset` type and the pure parser `getUtcOffsetMinutes` in `utils/dateTime` (slice 1), additive. Slice 4 (retention) needs an EventDoc hard destroy, which lands in `@qpqjs/features` as the uplift of Kiln's `askEventDocDestroy`.
- `doccypoccy` (follow-up, other repo): declare the report in `defineDocGenService`, append renders from the template service, a read route, the mapping onto `RegisterQueryAnswer`, a screen. Kiln's dashboard widget and the flow ops rollups come after.

## Approach

### The public surface

```ts
// apps/docgen/packages/service-utils/src/defineDocGenService.ts: declared identically in every service
defineReports('docgen', {
  owner: { module: DocGenServiceEnum.Template },

  // The fixed offset hours, days and months are counted at when an append or a read passes none. Default +00:00.
  utcOffset: '+10:00',

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
  { utcOffset: tenantUtcOffset },   // optional; the report's utcOffset otherwise
);

// where the chart is drawn, in any DocGen service: a declared view by name, or an ad hoc one
const byKind = yield* askReportRead('docgen', 'rendersByKind', { utcOffset: tenantUtcOffset });
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

`at` defaults to the appending story's `askDateNow`; a caller recording something that happened earlier passes it. The offset is resolved once per append (the option, else the report's `utcOffset`, else `+00:00`) and checked with `getUtcOffsetMinutes`. Under the hood `askReportAppend` is one `askEventBusSendMessages` to the derived bus with the event type as the message type, `{ scope, events }` as the payload and `${scope}/${type}` as the group id; nothing outside the module needs to know that. The consumer stamps each event's local keys with `reportBucketKeys(at, offsetMinutes)` before it is stored.

The period set is the register's (`RegisterQueryPeriod`), less the two that look ahead (`Next7Days`, `Next30Days`), because a report counts what has happened: `Today`, `Yesterday`, `ThisWeek`, `LastWeek`, `ThisMonth`, `LastMonth`, `Last7Days`, `Last30Days`, `ThisQuarter`, `ThisYear`, `ThisFinancialYear`, `LastFinancialYear`, and the rolling `{ period: Last, count, unit }` with `ReportPeriodUnit` `Day`, `Week` or `Month`. The comparison set is the register's three (`RegisterQueryCompare`).

What the read returns, for `rendersByKind` on 9 Nov:

```ts
{
  now: '2026-11-09T05:12:40.118Z',    // askDateNow at the read: what a line stops at and a pro rata goal measures from
  period: { period: 'last7Days', utcOffset: '+10:00', from: '2026-11-03', to: '2026-11-09' },
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
  truncated: false,                              // true if any merged document had an `other` cell in the period, or capped a name
  dimensionKeys: ['outcome', 'templateKind'],
  measureKeys: ['pages', 'renderMs'],
}
```

And the comparison a view with `compare` adds beside it, for `pagesThisMonth` on 9 Nov:

```ts
comparison: {
  compare: 'samePeriodLastYear',
  period: { period: 'thisMonth', utcOffset: '+10:00', from: '2025-11-01', to: '2025-11-09' },   // counted to the same point
  total: 380,
  sums: { pages: 1490, renderMs: 302114 },
  mins: { pages: 1, renderMs: 198 },
  maxes: { pages: 52, renderMs: 6110 },
  buckets: [ /* November 2025 by day, in time order, so buckets[i] reads against the answer's buckets[i] */ ],
}
```

### What `defineReports` emits

Everywhere (the owner field decides create versus reference):

- `defineGlobal(reportConfigGlobal(name), { views, events, scoped, utcOffset, financialYearStartMonth })`, so append, consume and read all see one declaration.
- `defineEventBus(reportEventBusName(name), { isFifo: true, owner })`.
- `defineEventDocSummary(reportStoreName(name), { snapshotFunctions, scoped, owner })`: the summary, events and snapshots stores and the drive. On the owner these are created and the events store's stream drives the summary projector; elsewhere they are references the read uses.
- `defineDynamicFunctions(eventDocFunctionsName(reportStoreName(name), REPORT_MONTH_DOC_TYPE), runtime)` for the month definition's fold, with no `owner`. A dynamic function runs in the service that calls it (the node processor loads the module locally and ignores `owner`), and every service that reads a view folds the month documents itself, so every service registers it.

Owner only, under `defineServiceSettings({ [owner.module]: [...] })`:

- `defineQueue(reportQueueName(name), { [REPORT_EVENTS_MESSAGE_TYPE]: onReportEvents with the global REPORT_NAME_GLOBAL }, { isFifo: true, batchSize: 10, maxTries: 5, ttRetryInSeconds: 30, eventBusSubscriptions: [reportEventBusName(name)] })`. The message type is fixed (`qpq/reports/events`) and the event type travels in the payload, because a queue matches processors by message type. `maxTries` is 5 because the default of 1 sends a message that lost a write race straight to the dead letter queue, and a lost message is a lost count; the retry wait is short because a FIFO group waits on it. Dead letter queue on by default. `concurrency` not set, since the deploy ignores it; FIFO group ordering serialises writers.
- The retention schedule (slice 4).

Returns config only (code standards: `define*` returns config, never spread). The bus and queue are internal: the derived names are the only way to reach them (`reportStoreName` is `${name}Reports`, `reportEventBusName` `${name}ReportEvents`, `reportQueueName` `${name}ReportFold`, `reportConfigGlobal` `${name}ReportsConfig`), so a report name is letters and digits only, starting with a letter. The owner is `CrossModuleOwnerWithNoResourceOverride & { module: string }`: names are derived (D4), so no `resourceNameOverride`. `utcOffset` must be `±HH:MM` from -12:00 to +14:00 in whole quarter hours (checked by the pure `getUtcOffsetMinutes`, so config stays pure); `financialYearStartMonth` is 1 to 12, default 7 (July, the register's `REGISTER_FINANCIAL_YEAR_START_MONTH`). Declared views are checked for shape at definition time:

- `period` is from the enum, and a rolling one has a whole `count` of at least 1 and a unit.
- `bucket` and `compare` are from their enums.
- `Hour` is used only with `Today` or `Yesterday`.
- An hourly comparison is only `PreviousPeriod` on `Today`.
- `SameDayLastWeek` and `SamePeriodLastYear` are not used on `Today` (see "Comparison").
- `filter` is a flat object, `groupBy` and `measure` are strings, and `groupLimit` is a whole number of at least 1.

They cannot be checked against event types, because those are not declared.

### Storage

One EventDoc collection per report, one doc type `REPORT_MONTH_DOC_TYPE` (`'reportMonth'`), one document per event type per calendar month in each scope, id `${type}~${yyyy}-${MM}` (`reportMonthDocId`), code and name `${type}/${yyyy}-${MM}`. The id is derived so the consumer and the read find a month with one key read and never list the collection (`askEventDocGetByCode` lists every document and filters in memory). `~` never appears in an event type, so an id cannot be read two ways, and an id holds no `/` or `#`, which EventDoc uses in blob paths and snapshot keys. The month is the event's stamped local month: at `+10:00` a render at 23:30 on 31 October (13:30Z) belongs to `documentRendered/2026-10`, not November's document. No `defineEventDocRoutes`: nothing appends to a month document except the consumer, which is the Kiln register's "NO ROUTES" pattern. With `scoped: true` every month document lives in the partition of the scope the events were appended under.

One log event type, `APPEND_EVENTS`, carrying `ReportMonthAppendEventsData`: `{ limits, events }`, with its `clientMessageId` set to the queue message's id, and the events exactly as appended, each with its `at`, `utcOffset` and `bucketKeys` (local hour, day and month) stamped. The limits (`ReportMonthLimits`: `maxCellsPerBucket`, `maxDimensionNames`, `maxMeasureNames`) travel on the log event, resolved by the consumer from the event type's settings, so the fold reads no config: changing a cap applies to messages from then on, and a refold uses each log event's own caps. The queue runs its handler once per message (a FIFO group's messages one after another), so the log holds one log event per message per month: one per `askReportAppend` call, however many events it carried. The log is the complete record: whatever the fold does with an event, the event itself is kept, which is what makes later views and a later backfill possible.

### The fold

The document view folds every `APPEND_EVENTS` into (`ReportMonthDocument`, which also carries the `EventDocDocument` base fields):

```ts
type ReportMonthDocument = EventDocDocument & {
  newestAt: Nullable<QpqIsoDateTime>;          // the latest event.at folded, never the clock
  newestDay: Nullable<string>;                 // that event's stamped local day, which the hourly trim counts back from
  hourly: Record<string, ReportCells>;         // key yyyy-MM-ddTHH:00, from each event's stamped keys; only newestDay and the day before
  daily: Record<string, ReportCells>;          // key yyyy-MM-dd, from each event's stamped keys, the month's days
  dimensionKeys: string[];                     // every dimension key seen this month, for the read and for screens
  measureKeys: string[];                       // every measure key seen this month (both lists stop at their name caps)
  namesCapped: boolean;                        // a name cap refused a dimension or measure name this month
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

- **Deterministic.** Buckets come from each event's stamped `bucketKeys`, never re-derived from `at`. The hourly trim keeps `newestDay` and the day before it (calendar arithmetic with `addDaysToTDateIso`), never anything relative to `askDateNow`. Replaying the log gives the same state, on any runtime and after any change to a tenant's offset: an event stays in the bucket it was first counted in.
- **Local keys.** Bucket keys are the register's text (`registerQueryBucketKey`): `2026-11-02T14:00` for an hour, `2026-11-02` for a day. At a fixed offset every local day is 24 hours long and half or quarter hour offsets (Adelaide, Nepal) need nothing special.
- **View independent.** The cell key is the event's whole dimension tuple, so nothing about a view is baked in. Weeks, months and quarters are not stored at all.
- **Bounded.** Daily is at most 31 keys. Hourly is at most 48: two local days of 24 hours. Cells per bucket are bounded by `maxCellsPerBucket` (default 200, per event type in `events`). An event whose tuple would open a cell past the cap lands in a reserved `other` cell, so a dimension that turned out to be high cardinality shows up as a number on the chart rather than a crashed Lambda. That caps the number of cells, not what goes in them, so two name caps per month document bound the rest (defaults 32 each, per event type in `events`): an event whose dimension names would take the month past `maxDimensionNames` is counted in `other` and adds no names, and a measure name past `maxMeasureNames` is not counted (new names are admitted in name order, so a refold decides the same way). Either sets `namesCapped`. All three caps are failsafes: ordinary categories never reach them, and a report that genuinely needs more raises them per event type. In normal use (a handful of cells per bucket) a state is tens of kilobytes. At the full cap in every bucket it would reach a couple of megabytes (79 buckets of 200 cells, each with a count and three numbers per measure), past `EVENT_DOC_SNAPSHOT_INLINE_MAX_BYTES` (300 KB), and the blob spill takes it.
- **Shape checked, not schema checked.** The consumer refuses an event (it is never appended) when:
  - its type is not a short string;
  - its `utcOffset` is not one `getUtcOffsetMinutes` accepts, or its `bucketKeys` do not match `reportBucketKeys(at, offset)`;
  - a dimension value is not a string, number or boolean;
  - a measure is not a finite number;
  - it carries more than `maxDimensions` (default 12) dimensions;
  - the whole event serialises past `maxEventBytes` (default 2 KB).

  Everything inside those bounds is appended as is. An event type is not required to have been seen before.
- **Commutative.** Count, sum, min and max only, the same four CloudWatch keeps per data point. Nothing in a cell depends on event order, which is what lets the read merge documents and what makes the counter per bucket design a drop in later. Min and max merge because report events are only ever appended, never taken back: the smallest of two cells' minimums is the minimum of all their events. A measure an event did not carry stays absent from that event's cell, never 0, so it cannot drag a minimum down.

### The bus, the queue and the consumer

**One message group per scope and event type.** `askReportAppend` sets `groupId` to `${scope}/${type}` (`reportGroupId`; scope from `askStorageScopeRead`, `unscoped` when there is none) and a fresh `deduplicationId`. The scope and the type also travel in the payload. The storage scope is not local context, so it rides the message's session anyway; the payload copy is what the consumer checks against the group and re-enters. The group gives:

- one ordered lane per tenant per event type, its messages handled one at a time, lanes running in parallel;
- a busy tenant backing up its own lane and nobody else's;
- exactly one writer for each month document, which is what makes the consumer's create-if-missing safe.

The FIFO per group ceiling, a few hundred messages a second, is therefore the ceiling per tenant per event type, which is where it should sit.

**One message at a time.** A qpq queue runs its handler once per message, not once per batch: `askProcessEventWithGroupOrdering` runs a FIFO batch's messages in order, each as its own story with its own SQS id (`QueueEvent.id`), and reports failures per message. So the consumer appends per message. `onReportEvents` reads the report name from its function global and hands `askReportEventsFold` the message id, the group and the payload:

1. `readReportEventsMessage(payload, groupId)`: the payload must be `{ scope, type, events }` and the group must be the one its scope and type name. Otherwise the message is refused: logged at error and acknowledged, never retried, because a retry would be refused again. A payload cannot fold events into a scope other than the one its lane belongs to.
2. `buildReportMonthBatches(message, settings)`: each event runs the shape check again (a bus accepts anything) and must be of the message's type; failures are dropped with one warning per message. The rest are cut to the type's `allowedDimensions`, stamped with their local keys (`stampReportEvent`) and split by month document, in month order.
3. Under the collection's store context and `askStorageScopeProvide(scope)` (or unscoped), for each month (`askReportMonthAppend`):
   - read the log head; on an empty log, create the document with its derived id (`askEventDocCreate`), as the reports system actor;
   - otherwise read the log tail (the last `EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW` events, `askReportMonthHoldsMessage`) and stop if this message's id is already there;
   - `askEventDocAppendServerEvents(docId, [{ type: APPEND_EVENTS, data: { limits, events }, version, clientMessageId: messageId }], REPORT_SYSTEM_ACTOR)`.

**Counting a redelivered message once.** If the Lambda times out or fails after some messages appended, SQS delivers the whole batch again. Each append carries the SQS message id as its `clientMessageId`, an option slice 2 added to `askEventDocAppendServerEvents` (a server event otherwise gets a minted id). EventDoc's own dedup then does the rest: the fold refuses an event whose `clientMessageId` is among the document's last 10 accepted, and the consumer reads the same window off the log tail so it skips the write too. A batch holds at most 10 messages (`REPORT_QUEUE_BATCH_SIZE`, the FIFO maximum, kept no larger than the window by a test), only the in-flight batch can come back, and only that group writes the document, so every message of a redelivered batch is still in the window. This works per month document, so a message straddling a month end that appended to one month and failed before the other is finished correctly on redelivery. It replaces the batch id and then `lastBatchMessageIds` designs, which assumed one append per batch.

### The read

`askReportRead(name, viewNameOrView, options?)`, run under the reader's scope. `options.utcOffset` is the offset to count at, else the report's `utcOffset`, else `+00:00`. DocGen passes the tenant's, the same offset it appends with. A view name resolves through the report's global; an undeclared name throws `ErrorTypeEnum.Invalid` naming it. An ad hoc view gets the same shape checks a declared one gets at definition, at read time. A view naming a dimension no event in the period carried is not an error: it reads with no groups and empty series, and `dimensionKeys` on the result says what was there, so a screen can offer the right choices.

1. **Resolve the period** from `askDateNow` at the offset (plain arithmetic), by the register's rules (`RegisterQueryPeriod`'s comment is the reference, copied, not imported):
   - Weeks start on Monday.
   - "Last N days" counts today as the last of the N, so "last 7 days" on the 8th is the 2nd to the 8th.
   - Calendar periods (this week, this month, this quarter, this year, the financial years) run their whole length, including days still to come.
   - The rolling `{ period: Last, count, unit }` is `count` whole days, weeks or months ending with the current one.
   - The financial year starts on `financialYearStartMonth`.

   The result is `{ from, to }` as inclusive local days.
2. **Work out the month documents** the period touches: one for `ThisMonth`, two for `Last7Days` near a month boundary, twelve for `ThisYear`. A period spanning more than 24 month documents (`REPORT_READ_MAX_MONTHS`) is refused with `ErrorTypeEnum.Invalid`; retention usually bounds it first.
3. **Read each one**, in parallel, by its derived id (`reportMonthDocId`, no listing): `askEventDocDocumentStateLatest` (snapshot seeded, so the fold is the gap since the projector last ran), in the reader's own scope. A month with no document is an empty month. These reads work from a non-owning service because the stores are cross module references and the month fold is registered in every service.
4. **Cut into buckets**:
   - `Hour` reads the hourly cells, and is offered only on `Today` and `Yesterday`, which the hourly keys always cover.
   - `Day` reads the daily cells.
   - `Week`, `Month` and `Quarter` add the daily cells up into buckets keyed by their first day (the Monday, the first of the month, the first of the quarter's first month), the same keys `registerQueryBucketKey` writes. A bucket at either end of the period counts only the days inside it, so the first week of "this month by week" may hold only the 1st and 2nd.
   - No `bucket` means no `buckets` on the answer, only the whole period's totals and groups, which is what a gauge or a ranked list wants.
5. **Collapse the cells** in each bucket: parse each cell key back into its dimension tuple, keep the tuples that match `filter` (values compared as text, own properties only), and fold each into the bucket's `count`, `sums`, `mins` and `maxes` (adding counts and sums, keeping the smallest and largest). With a `groupBy`, also fold it into the bucket's `series` under that tuple's value. A tuple without the groupBy dimension counts in the totals but no series or group (the register gives it a null group; a report keys series by text, so it has none). An `other` cell's tuples are unknown: it counts toward the totals only when the view has no filter, never toward a series or group, and it sets `truncated`.
6. **Fill** every bucket of the period, empty ones counted 0, including buckets still to come. An empty bucket has no `mins` or `maxes`, rather than a minimum of 0. As with the register, a chart stops at `now`, which the answer carries, rather than the answer stopping early.
7. **Totals and groups.** Work out `total`, `sums`, `mins` and `maxes` over the whole period. With a `groupBy`, also work out `groups`, one per value over the whole period:
   - ordered by the view's `measure` sum if it names one, else by count, largest first, with ties broken by value;
   - cut to `groupLimit`, with `groupsTotal` saying how many there were.

   A line reads the buckets; a gauge, a metric tile or a ranked list reads these.
8. **Comparison**, when the view names one (below).
9. Return `ReportReadResult`: `{ now, period: { ...periodRef, utcOffset, from, to }, bucket?, buckets?, total, sums, mins, maxes, groups?, groupsTotal?, comparison?, truncated, dimensionKeys, measureKeys }`, with `truncated` true if any merged document had an `other` cell in the period or has `namesCapped` set.

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

- **`runtime` on `defineReports`.** Config is data, so a function cannot travel in it. As with `defineEventDoc(functions, runtime, options)`, the app will export its definition from a module through `createReportMonthDefinition({ customViews })` and point `runtime` at it; absent, the framework's default module is used. Slice 1 builds the default module through that same factory, which takes no options yet (an accepted but unused parameter would be dead code, G11), so the option is a one line addition when the first custom view is wanted.
- **`custom: true` on a view declaration.** `views.<name>: { event, custom: true }` tells the read that the view's state comes from the projection of that name rather than from the cells, and `askReportRead` returns it per month document, merged across the period through the view's optional `merge(a, b)` when it has one.

A custom fold follows the same rules as the built in one, and the docs will say so: pure and deterministic (events only, no clock, nothing read from outside), bounded state (it is a snapshot), and mergeable if it is to be read across months. Unlike the cells, a custom view is view dependent, so adding one covers events from then on until the backfill job (out of scope) reprojects earlier months; the log keeps every event, so nothing is lost by waiting.

Tenant authored functions written in the UI are not this. They would be the sandboxed user script runner, and calling a sandbox from inside the projector is a per event Lambda cost; if ever wanted, they run as a separate batched consumer off the same bus, never as an EventDoc view.

### Slices

Each slice ships on its own and is reviewable alone.

#### Slice 1: the feature and its fold (built 9 Nov 2026)

1. `packages/core/`: the `UtcOffset` type in `types/QpqIsoDateTime.ts` beside the other ISO date-time template types (`±HH:MM`, a template literal over `THours` and `TMinutes`, so `'10'` or `'+10'` fails to compile) and the pure parser `getUtcOffsetMinutes(offset)`, which gives the minutes it adds to UTC or null for anything outside -12:00 to +14:00 in whole quarter hours. Day arithmetic reuses core's existing `addDaysToTDateIso(day, days).slice(0, 10)`: a plain day parses as UTC midnight. No `Intl`, no module state.
2. `packages/features/src/reports/models/`: `ReportEvent`, `ReportStoredEvent` (with `utcOffset` and `bucketKeys` stamped), `ReportBucketKeys`, `ReportDimensions`, `ReportDimensionValue`, `ReportMeasures`, `ReportEventSettings` (retentionMonths, maxCellsPerBucket, maxDimensionNames, maxMeasureNames, allowedDimensions), `ReportMonthLimits`, `ReportViewDefinition`, `ReportPeriod`, `ReportPeriodUnit`, `ReportCalendarPeriodRef`, `ReportRollingPeriodRef`, `ReportPeriodRef`, `ReportBucket`, `ReportCompare`, `ReportCell`, `ReportCells`, `ReportMonthDocument`, `ReportMonthAppendEventsData` and `ReportsConfig` (the global's shape).
3. `packages/features/src/reports/constants/`: `REPORT_MONTH_DOC_TYPE`, `REPORT_MONTH_SCHEMA_VERSION`, `REPORT_DEFAULT_UTC_OFFSET` (`+00:00`), `REPORT_DEFAULT_FINANCIAL_YEAR_START_MONTH` (7), `REPORT_OTHER_CELL_KEY`, `REPORT_HOURLY_DAYS_KEPT` (2), and the derived names `reportStoreName`, `reportEventBusName` and `reportConfigGlobal`.
4. `packages/features/src/reports/logic/`: `reportBucketKeys(at, utcOffsetMinutes)` (local hour, day and month keys: shift the instant by the offset and read its UTC fields, in the register's text), `reportMonthCode(type, bucketKeys)`, `reportCellKey(dimensions)` (keys and values URI-encoded, so a `=` or `|` in a value cannot split it) and `parseReportCellKey`; the definition-time checks `reportViewProblem`, `reportPeriodRefProblem`, `reportDimensionsProblem`, `reportEventSettingsProblem` and `reportUnknownKeyProblem` (a misspelt option such as `window` is refused); and `resolveReportsConfig`, which resolves the defaults and throws on the first problem.
5. `packages/features/src/reports/fold/`: the effect `ReportMonthEffect.AppendEvents` (`APPEND_EVENTS`) with `ReportMonthAppendEventsEffect`; the state updater `appendReportMonthEvents`; `reportMonthFoldReducer`; and pure helpers `applyReportEvents(state, events, limits)`, `applyReportEvent` (the name caps), `keepReportMeasures`, `addReportEventToCells`, `addReportMeasuresToCell`, `trimReportHourly`, `mergeReportKeys`, `createInitialReportMonthDocument` and `readReportOwnNumber` (a measure named `constructor` or `toString` reads only the event's own value, never `Object.prototype`'s).
6. `packages/features/src/reports/definition/createReportMonthDefinition.ts` and the default module `reports/module/reportMonthEventDoc.ts`. The definition has no identity, so one module serves every report's collection; `APPEND_EVENTS` is its one server-only event type.
7. `packages/features/src/eventDoc/config/defineEventDocSummary.ts`: `owner?: CrossModuleOwnerWithNoResourceOverride` on `EventDocSummaryOptions`, passed to the three stores and the drive. Additive; `defineEventDoc` leaves it unset.
8. `packages/features/src/reports/config/defineReports.ts`: the global, the FIFO bus, the month document stores and drive, and the month fold's dynamic functions (see "What `defineReports` emits"). The queue and its consumer come in slice 2.
9. Tests, each checked by breaking the rule it covers and watching it fail:
   - **Core offsets:** whole, half and quarter hour offsets either side of UTC, the -12:00 and +14:00 extremes, and refusal of `'10'`, `'+10'`, `'+15:00'`, `'-12:30'`, `'+10:20'` and a zone name.
   - **Fold:** one batch or two give one state; dimension order is one cell; the cap sends new tuples to `other`; the dimension name cap sends an event bringing a name past it to `other`, and the measure name cap leaves a name past it uncounted, admitting new names in name order; sum, min and max per measure, with a measure some events lack leaving the minimum alone; keys accumulate sorted; the fold counts where the stamped keys say, never re-deriving them from `at`; the hourly trim keeps the newest event's stamped day and the day before, across a month end; a late event does not move `newestAt`; events stamped before an offset change keep their own days through a refold.
   - **Keys:** 23:30 on 31 Oct at +10:00 is October's document and 31 Oct's day; half, quarter and negative offsets; a year end; cell keys round-trip, values as text.
   - **Definition:** a month log folds to its cells and its last batch's message ids; a fold resumed from a snapshot equals one from scratch.
   - **Config:** `defineReports` emits the offset and defaults, a FIFO bus and stores owned by the owner, the snapshot function map, and the dynamic functions with no owner; it refuses a bad report name, `'+10'` and `'+15:00'` as offsets, a financial month of 13, `Hour` on `ThisMonth`, `SameDayLastWeek` on `Today` and a cap of 0.

#### Slice 2: appending and consuming (built 9 Nov 2026)

10. `packages/features/src/eventDoc/`: `EventDocServerEventInput` gains an optional `clientMessageId`, which `askEventDocAppendServerEvents` uses in place of a minted one. Additive.
11. `packages/features/src/systemUsers/`: `REPORT_SYSTEM_USER_ID` (`system-reports`) and `REPORT_SYSTEM_ACTOR`, the actor on every month document.
12. `packages/features/src/reports/constants/`: `reportQueueName`, `REPORT_EVENTS_MESSAGE_TYPE`, `REPORT_NAME_GLOBAL`, the queue settings `REPORT_QUEUE_BATCH_SIZE` (10), `REPORT_QUEUE_MAX_TRIES` (5) and `REPORT_QUEUE_RETRY_SECONDS` (30), the defaults `REPORT_DEFAULT_MAX_CELLS_PER_BUCKET` (200), `REPORT_DEFAULT_MAX_DIMENSION_NAMES` (32) and `REPORT_DEFAULT_MAX_MEASURE_NAMES` (32), the event bounds `REPORT_MAX_DIMENSIONS_PER_EVENT` (12), `REPORT_MAX_EVENT_BYTES` (2048), `REPORT_EVENT_TYPE_PATTERN` (a letter, then letters, digits, `.`, `_` or `-`, at most 64) and `REPORT_RESERVED_KEYS`, and `REPORT_UNSCOPED_GROUP_KEY`.
13. `packages/features/src/reports/models/`: `ReportQueuedEvent` (an event as it crosses the bus) and `ReportEventsMessage` (the payload). `types/`: `ReportAppendOptions`, `ReportMonthBatch`, `ReportMonthBatches`, `ReportEventsMessageRead`.
14. `packages/features/src/reports/logic/`, pure: `reportQueuedEventProblem` (the shape check, with `reportNamesProblem`, `reportMeasuresProblem`, and core's new `isQpqIsoDateTime` guard, the guard form of `getValidQpqIsoDateTime`, which `DateISOSchema` now uses too), `toReportQueuedEvent`, `buildReportEventsMessages`, `reportGroupId`, `reportMonthDocId`, `readReportEventsMessage`, `readReportEventSettings` (own properties only, so an event type named `constructor` reads no settings), `resolveReportMonthLimits`, `keepReportAllowedDimensions`, `stampReportEvent` and `buildReportMonthBatches`. `reportMonthCode` now takes `(type, month)`.
15. `packages/features/src/reports/logic/`, stories:
    - `askReportAppend(reportName, eventOrEvents, { utcOffset }?)`: reads the report's global, stamps `at` (`askDateNow`) and the offset (the option, else the report's), runs the shape check and throws `Invalid` in the caller's story on the first problem, then reads the scope and calls `askReportEventsSend`.
    - `askReportEventsSend`: one bus message per event type. A failed send (`Throttled`, `TopicNotFound`, `AccessDenied`) is logged at error with the report name, the types and the count lost, and dropped rather than failing the caller: a count is a side effect of the thing that happened, and the error log is how the loss stays visible (decided by Joe, 6 Nov 2026).
    - `askReportEventsFold`, `askReportMonthsAppend`, `askReportMonthAppend` and `askReportMonthHoldsMessage`: the consumer described above.
16. `packages/features/src/reports/entry/queueEvent/onReportEvents.ts`, and the owner-only queue in `defineReports`.
17. Tests, each rule checked by breaking it and watching its test fail:
    - **Shape check and message reader:** every refusal, including a type that could break an id, path or group, a non-ISO `at`, too many dimensions, reserved names, an oversized event, and a group that disagrees with the scope or type (a security regression).
    - **Batches:** stamping, the split at a month end, dropped events counted with their reason, allowed dimensions, limits with defaults.
    - **Append (`runStory`):** one message per type in its group, `at` and offset stamping from the option or the report, the unscoped group, `Invalid` thrown with nothing sent, a `Throttled` send logged at error with no throw.
    - **Consumer (`runStory` over an in-memory key value store):** a fresh month created under its derived id then appended under the message id; a message redelivered after later ones and out of order appended once; a message straddling a month end split across two documents; allowed dimensions and the type's caps applied, malformed events dropped with one warning; a mismatched group refused with nothing written; an unscoped message folded unscoped.
    - **Definition:** a repeated `clientMessageId` folds once.
    - **Config:** the queue only on the owner's deploy, FIFO, subscribed to the FIFO bus (`assertFifoQueueEventBusSubscriptionsAreValid` passes), more than one try, the entry's global, and the batch size within the dedup window.

#### Slice 3: reading (built 9 Nov 2026)

14. `packages/core/src/utils/dateTime/`: `addCalendarMonths(day, months)`, a month step on a plain day that clamps to the target month's last day (31 March less a month is 28 February) as the register's does; core's existing `addMonthsToTDateIso` lets a short month overflow into the next (3 March), so it is not used for this and is left as it is. And `getWeekdayFromMonday(day)`.
15. `packages/features/src/reports/`:
    - models: `ReportResolvedPeriod` (the period ref, `utcOffset`, `from`, `to`, and on a comparison `until` and `beyondRetention`), `ReportReadBucket`, `ReportReadGroup`, `ReportComparisonResult` and `ReportReadResult`; types: `ReportReadOptions`, `ReportSpan`, `ReportReadPlan`, `ReportViewResolution`, `ReportCollapsedCells`, `ReportPeriodAnswer`; constants: `REPORT_READ_MAX_MONTHS` (24) and `REPORT_PERIOD_COUNT_MAX` (366, the register's rolling cap, now also checked on a declared or ad hoc view).
    - pure logic, copying the register's rules (`registerQueryPeriodDays`, `shiftRegisterQueryPeriodDays`, `registerQueryPeriodSpan`, `fillRegisterQueryBuckets`, `alignRegisterQueryComparisonGroups`): `resolveReportView`, `resolveReportPeriodDays`, `shiftReportPeriodDays`, `resolveReportComparisonSpan`, `reportSpanMonthCount` and `reportSpanMonths`, `reportSpanDays` and `reportSpanHours`, `reportReadBucketKey` and `fillReportBucketKeys`, `mergeReportCell` and `mergeReportSeries`, `collapseReportCells`, `buildReportPeriodAnswer`, `rankReportGroups`, `alignReportComparisonGroups`, `reportComparisonUntil`, `planReportRead` (the spans, the months each reads, the 24 month cap, the retention cut) and `buildReportReadResult`. Small helpers `addReportDays`, `reportDaysBetween` and `readReportOwnCell`.
    - stories: `askReportMonthStatesRead` (the month documents in parallel, by derived id) and `askReportRead`.
    - `testing/`: `createReportsMemoryStore` and `reportsDynamicFunctionsMock`, shared by the consumer and read tests (excluded from the build).
16. Tests, each rule checked by breaking it and watching its test fail:
    - **Periods:** every period around a Sunday, the register's "last 7 days on the 8th is the 2nd to the 8th", rolling days, weeks and months, the financial year either side of 1 July and with a January start, a year end.
    - **Comparison periods:** months shifted by months and the rest by days, the same day last week, the same period last year with 29 February clamped and Monday weeks moved 52 weeks; this month to the 9th against last month to the 9th, 31 March against all of February, a finished period counted whole, today against yesterday cut at the current hour.
    - **Buckets:** week keys on Mondays with the part week before the 1st, months and quarters, a day's 24 hours or its hours to the last one counted.
    - **Cells:** totals and series, a filter leaving out the `other` cell, values compared as text, an Object.prototype name never matching.
    - **Answers (over states folded by the real fold):** renders by kind over the last 7 days (every day drawn, every series in every point, an empty day with no min or max); weeks of this month; this month against last month to the same day with groups ranked by pages and lined up; today against yesterday by the hour with `until`; groups cut to the limit with `groupsTotal`; `truncated` with the other cells still in the total; a comparison past retention read as nothing and flagged; the 24 month cap.
    - **End to end (`runStory`):** events appended through the consumer and read back through EventDoc and the real month fold across two months, a redelivered message counted once; a declared view by name; another tenant reading none of it (a security regression); Invalid for an unknown view, a bad ad hoc view and an overlong period.
17. Export from `packages/features/src/index.ts` (through the reports barrel). A docs page for `askReportAppend` and `askReportRead` beside the `defineReports` one in the docs site is still to write; `breaking-changes.md` untouched (additive).

#### Slice 4: retention

17. Uplift `askEventDocDestroy` from Kiln into `packages/features/src/eventDoc/logic/` with the tombstone on the append path, per the Kiln design's "hard destroy" section. Its own plan when it is picked up; this slice depends on it.
18. `packages/features/src/reports/entry/schedule/reportRetention.ts` and the `defineRecurringSchedule` in the owner-only block, gated on a `retention: true` option until step 17 ships.

#### Slice 5: DocGen (doccypoccy, separate branch)

19. `defineReports('docgen', { owner: { module: DocGenServiceEnum.Template }, utcOffset, views, events, scoped: true })` in `apps/docgen/packages/service-utils/src/defineDocGenService.ts`, beside the `ops-alerts` bus, so every service declares it and the template service materialises it. The view declarations live in an app package (`@docgen/constants` or a new `@docgen/reports-config`), never in a service package, per the one way dependency rule in doccypoccy's CLAUDE.md.
20. Template service: `askReportAppend('docgen', ..., { utcOffset })` at the two ends of `askTemplateRenderJobProcess` (success with `outcome: ok`, failure with `outcome: failed`) and in the pack build, passing the tenant's offset (open question 4). Dimensions: template kind and outcome. Measures: pages if the PDF step reports it, and render milliseconds.
21. A read route in the template service (or admin, see open questions) that takes a view name or an ad hoc view, checks a permission, and returns `askReportRead` at the tenant's offset. Beside it, a pure `toRegisterQueryAnswer(result)` in a DocGen package maps a `ReportReadResult` onto what Chris's widgets read:
    - `buckets` become `groups` with the bucket key as `value`, for a line;
    - `groups` become `groups`, for a ranked list;
    - `total` becomes `total`, and `sums`, `mins` and `maxes` become `aggregates`, with a Sum, Min and Max per measure and an average as sum over count;
    - `period` becomes `periods[0]`, with `path` set to an instant path (`@at`), so the widget's "written a day behind" rule never applies and a line runs to `now`;
    - `comparison` is mapped the same way;
    - labels are added with the register's `registerQueryBucketLabel`.

    No arithmetic beyond the average. It is written against `RegisterQueryAnswer` as it stands on `harry-kiln-dashboards`, and follows it if that changes before it merges. A first screen draws the declared views through Chris's widgets and offers `dimensionKeys` for ad hoc ones.
22. Later: a `Report` widget kind on Kiln's dashboard view reading through the same route, and replacing the flow ops rollup projector with `askReportAppend` calls at the run lifecycle transitions, keeping `FLOW_RUN_FACTS_STORE` for the watchlist and in flight registry, which are state, not counts.

## Security and compliance

- **The append is open, so the discipline sits with the appender.** Any string can be a dimension value, so a user id or an email address can be appended and will then sit in an append-only log for the retention period and be visible to anyone with read on the report. The feature docs say plainly: dimensions are categories, never identifiers. Two guards the plan adds so this is not only a convention: an optional `events.<type>.allowedDimensions` list which, when set, makes the consumer drop any other key for that type (the closed set is opt in per type, not required), and `maxDimensions` and `maxEventBytes` which keep a free text field from being used as a dimension. Worth raising with whoever owns the ISO 27001 records of processing before the first tenant facing stream, because an open append surface is a new place personal data could land.
- **Tenant scoped.** The message group, the payload, the month documents and the read all carry the scope; the consumer re-enters it exactly as the EventDoc summary projector does. An event appended under one tenant cannot be folded into another's document, and a message whose group and payload disagree is refused and logged (`readReportEventsMessage`, tested as a security regression).
- **Open bus, closed fold.** Any service with publish rights on the report's bus can append, and any service may subscribe to it by its derived name. Those are deploy permissions to manage like any other. A subscriber other than the module sees raw events, so adding one is a reviewable config change.
- **Bounded cost.** Hourly 48, daily 31, cells capped, dimension and measure names capped per month, events capped in size and dimension count, one append per batch, one read per month document, at most 24 month documents for each side of a read. No path reads a whole tenant, and one tenant's lane cannot starve another's.
- **Retention is a destroy, not an expiry.** Month documents are the unit, so "we keep 13 months of render counts" is a sentence the platform can keep, once slice 4 lands. Until then the honest wording is "retained", the same caveat the Kiln design applies to registers.
- **Audit.** Reads are not audited at the event level because an event is not meant to be a record about a person. The DocGen route that exposes a view decides whether to ledger the read. (Kiln's register query ledgers every read, so a dashboard polling every 20 seconds writes rows all the time it is open; a report route need not copy that.)

## Out of scope

- **Backfill.** Not needed for a new view, because cells are view independent. It is needed only if the fold's own rules change (a different cell cap, a new trim, a changed cell key), or to move a tenant's past events to a new offset. The mechanism already exists in EventDoc: bump the definition's `snapshotCacheKey` so old snapshots become invisible, then `askEventDocReprojectHead` on each month document, which refolds the whole log under the new rules. A small admin job over the month documents in retention is all that is missing, and the log keeps every event as appended so nothing is lost in the meantime.
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
4. **Which offset DocGen uses.** DocGen passes an offset on every append and read; the framework only needs it to be the same on both sides. For tenants in Sydney, Melbourne, Canberra or Hobart the choice is `+10:00` (exact in winter, an hour out in summer) or `+11:00` (the reverse); for Adelaide `+09:30` or `+10:30`. The proposal is one `+10:00` for the whole app until a tenant elsewhere signs up, later a tenant setting. A tenant whose offset changes keeps its past events on their old days until a backfill moves them.
5. **Same hour comparisons further back.** Keeping hourly cells for the newest event's local day and the seven days before it, instead of one day, would allow "today against the same day last week" to the same hour, as the register does on an instant. It multiplies the hourly part of the state by four (192 keys instead of 48). The proposal is one day now, refusing `SameDayLastWeek` on `Today`, and widening it if a dashboard asks.
6. **Events dated in the future.** The hourly trim keeps the newest event's local day and the day before. An event whose `at` is ahead of the clock (a caller passing a future time, or a skewed clock) moves that day forward and can trim yesterday's hours early, so a today against yesterday comparison reads low until the real day catches up. The proposal is for the consumer to drop, with a warning, any event more than a few minutes ahead of its own `askDateNow`.
