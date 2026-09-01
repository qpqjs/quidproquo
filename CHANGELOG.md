# Changelog

## 0.1.19

- core: `defineRecurringSchedule` takes a structured `ScheduleRecurrence` (`everyMinutes`, `everyHours`, `dailyAtUtc`, `weeklyAtUtc`, `monthlyAtUtc`) instead of an AWS cron string, and rejects intervals that can't be scheduled evenly at config time. Cron rendering now lives only in deploy-awscdk, so the dev server fires the same schedules locally on the minute
- dev-server: graceful shutdown. SIGTERM/SIGINT drains in-flight work (queue messages, kvs-stream projections, storage-drive handlers) and checkpoints the stores before exit, with a 5s worst-case budget. `qpq go:dev:api` waits for the drain on restart and handles SIGTERM as well as SIGINT, escalating to SIGKILL if the old server wedges so the ports are free for the replacement
- dev-server: `GET /admin/service/ready` answers 503 until every subsystem is up and 200 after, for CI scripts and docker healthchecks that need more than a TCP connect
- deploy-rspack: starting the dev server when no service infrastructure loads now fails immediately with the service names and a hint to build the app's packages, instead of a `reading 'reduce'` crash later inside express
- deploy-awscdk: recurring schedule lambdas are handed the real firing time again; `ScheduledEventParams.time` was undefined because the rule target input replaced the whole event payload

### Breaking changes

- `defineRecurringSchedule` takes a `ScheduleRecurrence` object instead of a cron string; `ScheduleQPQConfigSetting.cronExpression` becomes `recurrence`
- `awaitQueueIdle` (dev-server) is renamed to `awaitDevServerIdle`; no shim
- every dev-server `*Implementation` now resolves once its subsystem is up (returning a `DevServerPluginStop`) instead of never resolving

## 0.1.18

- core: a function runtime can carry its own `actionProcessors` (a list of getActionProcessors-style sources); they merge over the platform and service-wide processors for that function's whole execution, last wins, and in-process nested executions inherit the merged list
- webserver: route auth decode runs on every request, with or without a `userDirectoryName`, and reports `notApplicable`/`valid`/`invalid`, so a per-route processor override can supply its own token validation (e.g. a github oidc endpoint)
- deploy-awscdk: lambda role grants for owned kvs tables, parameters, secrets and storage drives are conditioned on the application/module/environment tags instead of listing two exact arns per resource, so a service with many stores no longer blows the 10,240 byte inline-policy cap

### Breaking changes

- `askRouteAuthValidationDecode` returns a `RouteAuthDecodeResult` tri-state instead of `DecodedAccessToken | null`, and is always yielded; custom processors must return the new shape

## 0.1.17

- core: `createActionRequester` and `createActionProcessor` factories, and every built-in action across the packages is migrated to them. A requester now carries its own payload type and error enum (`askX.errorTypeEnum`), and a processor types its handler as `ProcessorFor<typeof askX>`
- `askNetworkRequest` responses expose every raw `Set-Cookie` line in order via a new `setCookies` field
- dev-server: the kvs engine moves from a json file to sqlite (node:sqlite) and batches upsert-many writes, so large stores no longer hit the string-size limit
- core: `askBatch` skips yielding an action for empty input
- readmes and package repo urls point at the qpqjs org, and all packages publish with public access

### Breaking changes

- `HTTPNetworkResponse` gains a required `setCookies: string[]` field
- the claudeAi action and config (`askClaudeAiMessagesApi`, `defineClaudeAI` and friends) are removed; use `askAiPrompt` with `defineAi`
- per-action type exports (`*ActionPayload`, `*Action`, `*ActionProcessor`, `*ActionRequester`) and standalone error enums are removed across all domains; use `ProcessorFor<typeof askX>` and `askX.errorTypeEnum`

## 0.1.16

- event docs: paging an ascending event list no longer races a snapshot written between pages (the continuation dropped the stale lower bound that could push the cursor outside the key condition and trip a DynamoDB ValidationException)
- websockets: `defineWebsocket` keys its resources on the api subdomain alone, so changing a service's root domain no longer renames the logical id and leaves the stack undeployable

### Breaking changes

- `defineWebsocket`'s `uniqueKey` drops the root domain; expect WebSocket API resources to be replaced on the next deploy

## 0.1.15

- event docs: a definition declares `versions` (oldest first) with a view map per version, instead of a top-level `foldReducer` plus a `migrations`
  map. Folds are per view (`definition.views.document.fold`), every definition gets a built-in `summary` view, and a version that skips a view or a
  mismatched `schemaVersion` throws at definition time instead of failing quietly later
- event docs: reads fold from the newest snapshot plus the events after it instead of replaying the whole log. Snapshots are written per view along
  the log and seeded from the prior snapshot, and the workspace opens from a snapshot base rather than the full history
- event docs: a collection registers one functions object (fold, snapshots, render, references, validator) as a single dynamic-functions
  registration, so `defineEventDoc(functions, runtime, options)` replaces the per-hook inline function names, and the render and references routes are
  always mounted
- dynamic functions: `defineDynamicFunctions` registers a whole exported object of functions and `askDynamicFunctionExecute` calls one of them by
  name, so a feature can hand a caller a named bundle instead of one inline function per hook
- event docs: `askEventDocAppendServerEvents` writes a burst of server-authored events in one batch, one clock read and one id mint and one write per
  burst where a loop of single appends paid five actions per event. Backed by new `askKeyValueStoreUpsertMany` and `askGuidNewSortableMany` core
  actions (DynamoDB `BatchWriteItem` with backoff on AWS, per-item stream emission on the dev server so projectors see the same records)
- event docs: an append runs the collection's registered validator before the write and rejects there, so an event a rule forbids never lands in the
  append-only log. Server-authored appends stay write-and-go and are still gated by the fold
- event docs: the workspace history panel pages through the log (`askLoadOlderHistory`, newest first) instead of loading every event up front
- event docs: `createEventDocBackend` binds the generic document verbs to one collection, so a caller stops threading `storeName`/`type` through every
  call
- `askEventDocDocumentStateLatest` resolves its head with a consistent read, so a writer reading back its own append no longer sees a truncated or
  empty log
- cdk: the shared key-value-store role policy grants `dynamodb:BatchWriteItem`, so batch writes work on deployed functions

### Breaking changes

- `defineEventDoc(options)` becomes `defineEventDoc(functions, runtime, options)`; `defineTenantedEventDoc` changes the same way
- `EventDocRoutesOptions`, `EventDocStoreOptions`, and `EventDocStore` drop `eventValidator`, `eventRenderer`, `referenceResolver`, and `snapshotFold`;
  the render and references routes resolve from the registered functions object instead
- `defineEventDocSummary`'s `snapshotFolds` is renamed `snapshotFunctions` and its values are dynamic-function names, not inline function names
- `EventDocTransferCollection` drops `referenceResolver`, and `defineEventDocTransfer`'s `collections` takes `EventDocTransferCollectionSource[]`
- `createEventDocDefinition`'s saved-doc config drops `foldReducer`, `createInitialViewState`, and `migrations` in favor of a `versions` array
- the object `createEventDocDefinition` returns has no top-level `fold`; use `definition.views.document.fold(events)`
- every definition now has a built-in `summary` view, so a `versions` entry declaring its own view named `summary` throws
- `foldSnapshotViews` takes an optional `seedViews` second argument and returns `Nullable<EventDocSnapshotViews>`
- `EventDocFunctions`, `EventDocDefinition`, and `EventDocInvokableFunctions` gain required `foldDocumentState` and `collectReferencesFromState`
- `foldEventDocLogStep` returns `[state, accepted]` instead of just the state, and its config drops `acceptance`
- `buildVersionRoutedReducer` throws when an event's version has no registered reducer instead of silently skipping it
- `foldEventDocSummary` and `createEventDocSummarySeed` drop their `type` param and return `EventDocSummaryView`; `eventDocSummarySchema` is now the
  stored shape and `eventDocSummaryViewSchema` the plain view
- `EventDocAcceptance`, `createEventDocAcceptance`, and `recordEventDocAcceptance` are removed, and `rejectEventDocEvent` drops its `acceptance` param
- `EventDocRenderInput` drops `events` for `state`; `EventDocOnAppendInput` and `EventDocOnPublishInput` drop `events` for `state`/`previousState`
- `EventDocBackend.askEventsAsOf` is renamed `askDocumentStateAsOfTime` and returns folded state, `askDocumentStateLatest` is added, and
  `askPublishedEventsAsOf` is removed
- `askEventDocEventsAsOf`, `askEventDocPublishedEventsAsOf`, and `askEventDocSnapshotAtEvent` are removed; use the document-state stories and
  `askEventDocProjectAtEvent`
- `EventDocVersionSlice` is replaced by `EventDocVersionState`, so `askEventDocPublishedVersionAsOf` returns `{ version, state }`
- `askEventDocReferences` is the full-history walk only; use the new `askEventDocReferencesFromState` for what a document references right now
- `EventDocWorkspaceTransport` gains a required `askFetchEventsPage` and `EventDocWorkspaceBuiltInApi` gains a required `askLoadOlderHistory`
- `EventDocWorkspaceState.fullHistory` holds an `EventDocWorkspaceHistoryPage` instead of an event array, and `askUIEventDocWorkspaceSetFullHistory`
  takes that page
- an append to a collection with a registered functions object now fails pre-write when the validator rejects the event, instead of being written and
  dropped at fold time

## 0.1.14

- event docs: a recorded value picks its own storage. `askEventDocWriteValue` carries small values inline (4KB per value, 32KB per event) and falls
  back to a blob asset above that, so a five byte output no longer costs two blob objects to store and two round trips to read back
- event docs: the collection list is cursor paged. The list route takes `?limit=`/`?nextPageKey=` and returns `{ items, nextPageKey }`,
  `askEventDocListFetchAll` keeps the old read-everything behaviour, and the list state module pages with next/previous instead of numbered pages
- event docs: a collection's rules are declared as `validators` keyed by event type, and the fold is what enforces them. An event the validators
  reject is now skipped when folding a stored log, not just blocked in the editor
- kvs: `askKeyValueStoreQuery` takes `consistentRead`, for a caller that just wrote and is reading back to decide something
- transient AWS failures (throttles, capacity, service unavailable, connection resets) are classified as `OutOfResources` instead of falling through
  to a generic error, so a caller can tell "busy, try again" from "this request is wrong" without matching on error text
- `defineQueue`'s `batchWindowInSeconds` defaults to 0 (invoke as soon as a message arrives) and now honours an explicit 0, which used to be swallowed
  as falsy
- kvs stream handlers are included in the bundled src entries, so the handler ships in the lambda zip and resolves in the dev server instead of
  silently never running, and their invocations are indexed for admin log search
- dev-server: `qpq migrate` flushes pending kvs writes before the process exits

### Breaking changes

- `EventDocSavedDefinitionConfig.validate` is replaced by `validators`, a registry keyed by event type
- `EventDocUnsavedDefinitionConfig.validate` is removed with no replacement
- validators are enforced by the fold, so a stored event the guard rejects is skipped rather than applied
- `defineQueue`'s `batchWindowInSeconds` default changes from 5 to 0; pass it explicitly to accumulate a batch
- the event-doc list route returns `QpqPagedData<EventDocSummary>` instead of a bare array, and takes `?limit=`/`?nextPageKey=`
- `askEventDocListFetch` returns `QpqPagedData` and takes an options argument; use the new `askEventDocListFetchAll` for the old behaviour
- the event-doc list state module moves from numbered pages to cursors: `page` becomes `pageIndex`/`cursors`/`nextPageKey`, `SetItems`/`SetPage`
  become `PageLoaded`/`SetPageIndex`, and `clampEventDocListPage` is removed

## 0.1.13

- web-react: the runtime store is rewritten from jotai to an internal refcounted qpq store. Definitions take a single options object with a
  `uniqueName` (federated modules that bind the same name share state) and an optional `onInit` story, and area state is cleaned up when its last
  consumer unmounts. Apps wrap their tree in a `QpqStoreProvider`
- kvs change data capture: `defineKeyValueStore` accepts an `onStream` handler that receives insert/modify/remove records with old and new values,
  backed by DynamoDB streams on AWS and fully supported in the dev server, with batch size, batching window, and per-partition-key coalescing options
- event docs: event ids move from a numeric counter to sortable uuidv7 strings (admin session logs use the same ids), soft delete and restore are
  recorded as reserved DELETE/RESTORE events with a new `askEventDocRestore` to undo a delete, and the summary row is rebuilt asynchronously by a kvs
  stream projector instead of on the append path
- new `askKeyValueStoreScanAllScopes` action: scan a store across every tenant/personal scope, for writing migrations
- cli: new `qpq migrate` command runs pending migrations against the local dev server
- web-react: a websocket service-request correlation stays alive after the response arrives, so a handler that responds first and keeps streaming no
  longer has its later messages dropped
- deploy-rspack: `react-refresh` is now a declared dependency instead of being assumed from the consumer

### Breaking changes

- `EventDocStoredEvent` gains a required `type` field; `eventDocEventToStoredEvent` takes a new `type` argument
- event-doc summaries rebuild asynchronously after append; re-read after a delay or fold the log if you need the just-appended event
- event-doc event ids are strings now: `EventDocEventMetadata.index`, `EventDocVersion.eventIndex`, and `EventDocLink`'s `eventIndex` become
  `eventId: string`, and `EventDocStoredEvent.sk` becomes a string
- `EventDocEventListOptions.afterIndex` is renamed to `afterEventId` (the `?afterIndex=` query param too)
- `askEventDocSoftDelete` requires a new `schemaVersion` argument; delete is now an event and `askEventDocRestore` undoes it
- `renumberWorkspaceEvents` is removed; committed workspace events mint a real id at commit time
- web-react runtimes must be bound inside a `QpqStoreProvider`; the jotai dependency is gone
- `createQpqRuntimeDefinition` takes a single options object with a required `uniqueName`
- `useQpqRuntime` drops the `mainStory` argument; move that story to the definition's `onInit`
- `createQpqRuntimeComputed` returns a `{ definition, compute }` object instead of a callable
- runtime state is deleted when its last consumer unmounts instead of persisting for the page's lifetime
- web-react's `hooks/asmj/*` deep imports are removed; import from the package root

## 0.1.12

- generic crypto: new `askCryptoEncrypt`/`askCryptoDecrypt` actions in core with `defineCryptoKey` config, KMS envelope encryption on AWS and a
  local master-key provider for node/dev-server
- event doc transfer: export a doc (events, assets, references) as a bundle and import it into another collection, with `defineEventDocTransfer`
  config, export/import on list screens gated by `canTransfer`, and imported events attributed to the importing user
- deploy-rspack: static assets in `src/public` are copied into the views build output
- aws lambda processor fixes: missing storage drives and undecodable auth tokens now raise typed errors, dynamo orm query/update expression fixes,
  jwt/s3/cognito filter fixes
- `askQueryParamsSet` in the browser keeps the url hash and no longer leaves a dangling `?` when the last param is removed
- log create no longer drops falsy log data, and network request logs no longer include urls
- neo4j: result type guards no longer throw on null cells
- quidproquo-testing: fix `toYieldSequence` dropping the given input
- cli: combined `go:dev` no longer interleaves "started" noise lines with the api output

### Breaking changes

- `GraphDatabaseNeo4jQPQConfigSetting` is removed from quidproquo-neo4j (it was never used)
- `EventDocListConfig` requires a new `canTransfer: boolean` field
- `EventDocListItem` requires a new `type: string` field
- `EventDocBundleApplyOptions` requires a new `importerUserId: string` field
- `askEventDocWriteForeignEvents` now takes an options object (`{ importerUserId, logRewritten? }`) instead of a trailing boolean
- `ApiRequestActionProcessorOptions.getHeaders` now returns `Nullable<Record<string, string>>`; return `null` instead of `undefined`
- `getStateMachineByName` now returns `Nullable`; check for `null` instead of `undefined`
- `askStateMachineSendEvent` now fails with `BadRequest` on a finished machine, and valid self transitions are accepted
- `StateMachineEvent` extra fields narrow from `any` to `unknown`
- `storyLogger`, `storyLoggerFs`, `getS3Logger`, `getS3LoggerViaExtension`, and `moveLogsToPerminateStorage` are removed; use `getLogger`
- `viewerRequestEventHandler` is removed; call `getCloudFrontRequestEvent_viewerRequest()` instead
- `QpqWarmLambdaEvent` is removed; warm invokes arrive as SNS warmer records
- `findMatchingCertificates` and `getDomainValidationOptions` (acm deep imports) are removed
- `getDefaultAppName` in quidproquo-deploy-rspack now returns `Nullable`; check for `null` instead of `undefined`
- `getGuidProcessor` is renamed to `getGuidActionProcessor`

## 0.1.11

- email sending: new `askEmailSendEmail` action in quidproquo-webserver, backed by SES v2 on AWS, with `defineEmailSender` config and an AWS sender
  allow list, plus `askEmailSetDeliveryStatus` for tracking delivery status
- admin action search: searchable action and entity indexes built from service logs, with definition registries for email and network actions, new
  admin routes, and an action search screen (filters, grid, entity timelines) in web-admin
- admin maintenance mode rebuilt as an event doc collection with typed update logs, active windows broadcast to the app websocket as public state,
  and stale websocket connections cleaned up during broadcasts
- event doc definitions: `createEventDocDefinition` describes a saved or local doc in one place, with new `askEventDocReadState` and
  `askEventDocReadIdentity` actions and generic set-code/set-name/draft/publish verbs merged in automatically
- `forceReloadFederatedRemote` in quidproquo-web for hot-swapping a federated remote without a full page reload
- event doc workspace snapshot restore now carries local slots and history through
- cli: views s3 sync sets cache-control headers (long-lived hashed assets, no-cache html)
- bump aws sdk clients, aws-cdk-lib, constructs, and lambda types; drop the adm-zip dependency

### Breaking changes

- `askSetMaintenanceMode` and the admin `POST /maintenance/set` route are removed; maintenance is now an event-doc collection at `/maintenance`
- the websocket maintenance broadcast now carries the full list of public maintenance states; the old `{ active, level, message }` types are removed
- `createEventDocWorkspace` output reshaped: per-slot verbs live at `docs.<slotKey>.api`, built-in verbs directly on `api`
- `EventDocWorkspaceDefinition.selectors` is removed; the workspace always builds its own selectors
- `createEventDocWorkspaceSlot` is removed; use `createEventDocDefinition` (with `saved: false` for local slots)

## 0.1.10

- event-doc workspace frontend state module: fold history at write time, transient (never-saved) event streams, typed per-slot errors, typed effects
  with asset transport, plus a new event-doc list state module
- logout and refresh-token work: revoke refresh token and global sign-out actions, configurable token refresh buffer, and preserve the existing
  refresh token when cognito doesn't rotate it
- circular import detection in the cli (`qpq check:circular`) and rspack builds, failing the build by default
- contentDisposition support for upload secure urls
- eslint-config: new yield-star and ask-prefix lint rules, and the qpq plugin is now exported for standalone use
- fix nested implementation stories dropping the caller's globals/context, and ai attachment scope resolution
- cli hardening: validate synth service names, shell-less spawn, and correctly quoted docker args
- new logo mark and a title shine effect on the nav

### Breaking changes

- `askApiRequest` and the `Api` action move from `quidproquo-web` to `quidproquo-webserver` (action type string changed too)
- reserved event-doc effects renamed to `EventDoc*` and now carry plain event data instead of pre-wrapped payloads
- `askUIEventDocWorkspaceApplyEvent` drops its `isPending` arg; every commit now lands in the slot's `pending` buffer
- `EventDocWorkspaceState` gains required `historyViews` and `transient` fields; the initial/reducer builders take slot configs
- `selectEventDocWorkspaceIsDirty`/`IsSaving` and `foldSlotHistory` removed; use a workspace's own selectors
- event-doc workspace slot errors are now typed (`EventDocWorkspaceSlotError`), and `askUIEventDocWorkspaceClearError` is the way to clear them
- `qpq check:circular` and the rspack circular-check plugin fail by default; `--error`/`QPQ_CIRCULAR_DEPS_ERROR` replaced by `--warn`/`QPQ_CIRCULAR_DEPS_WARN`

## 0.1.9

- eventDoc render route honors `renderMode=published`: renders the version published as of a given time instead of always the full draft log, backed
  by new `askEventDocPublishedVersionAsOf` and `askEventDocEventsAsOf` resolvers
- tenant routes split: the tenant collection stays at `basePath`, membership routes (list mine, create, logo) move to a new `myTenantsBasePath`;
  eventDoc routes gain an `excludeRoutes` option to skip stock endpoints
- web-admin: show basePath in log summary details

### Breaking changes

- the eventDoc render route now throws `NotFound` for `renderMode=published` with nothing published; `EventDocRenderInput` gains a `version` field
- `defineTenant` now requires `myTenantsBasePath`; membership routes move there and stock eventDoc CRUD mounts at `basePath` directly

## 0.1.8

- tenant support: typed `TENANT#`/`PERSONAL#` storage scopes across file, kvs and websockets, an owner-gated tenant registry, and a scoped tenant
  collection
- tenant branding: logo as an uploaded asset ref (with a presigned url route), typed primary/secondary brand colors
- security review sweep across core and webserver: action-typed errors instead of generic ones, cross-tenant scope leak fixes, validator hardening
- streaming event-doc ai chat with tool calling, replacing the old admin log chat
- client-side ai tools: optional executor, halt the turn to ask the user, resumable turns on halt
- typed ai stream finish reasons and a much wider `AiStreamPart` union
- new cli commands: interactive menu for bare `qpq`, `clear-resources` to empty buckets/tables, positional args for `go`/`go:docker`, federated remote
  publish on deploy
- concurrent workspace builds with a multi-lane progress bar and dependency-ordered parallel hooks
- websocket queue and admin log service moved into `quidproquo-features`
- dev server: type watcher, view hot reload, linked package aliasing, per-app runtime scoping
- dev server kvs backend swapped from sqlite to json files
- waf rule action overrides for managed rule groups
- deploy-awscdk: role IAM grants moved to managed policies to dodge the inline policy cap
- module federation expose bundles now split shared chunks
- queue config resolved from qpqConfig instead of env json
- narrower own-code detection in node story traces
- dev process handling: sweep lingering qpq processes before the dev server starts, without killing the caller's own process chain
- deploy-rspack loads markdown imports as raw source
