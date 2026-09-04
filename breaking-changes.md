# Breaking Changes

Running log of breaking changes, grouped by target release version. Add a dot point per breaking change as it lands so the release notes can be
assembled quickly.

## vNext

- `defineOpenApi`, `askGetOpenApiSpec`, `OpenApiSpecActionType`, and `getAllOpenApiSpecs` (`quidproquo-webserver`) are removed with no replacement; drop any config or route code depending on them.
- `dynamicRoute`, `createRouteDefinition`, and `createTenantedRouteDefinition` (`quidproquo-features`) take a `DynamicRouteConfig` object as their third argument instead of a bare known-errors map: `usersRoute(['POST', '/x'], handler, { [ErrorEnum.X]: 401 })` becomes `usersRoute(['POST', '/x'], handler, { knownErrors: { [ErrorEnum.X]: 401 } })`. Handlers can also add a third `input` parameter (`{ body, query }`, parsed against an optional `schema.body`/`schema.query` zod schema) if they want validated request data.

## 0.1.19

- `defineRecurringSchedule` (`quidproquo-core`) takes a structured `ScheduleRecurrence` instead of an AWS cron string: `defineRecurringSchedule('0 0 3 * * ? *', runtime)` becomes `defineRecurringSchedule({ dailyAtUtc: { hour: 3, minute: 0 } }, runtime)`. The variants are `{ everyMinutes }` (must divide 60), `{ everyHours, atMinute? }` (must divide 24), `{ dailyAtUtc }`, `{ weeklyAtUtc }` and `{ monthlyAtUtc }`, all UTC. An interval that cannot be scheduled evenly now throws an `InvalidScheduleRecurrenceError` while the config is evaluated. Cron is no longer a core concept: `renderAwsCronExpression` in `quidproquo-deploy-awscdk` is the only place that knows the EventBridge dialect, which is what lets the dev server fire the same schedules locally.
- `ScheduleQPQConfigSetting.cronExpression` (`quidproquo-core`) is replaced by `recurrence: ScheduleRecurrence`. Anything reading the setting to get a cron string should call `resolveScheduleFields(setting.recurrence)` and render from that.
- `awaitQueueIdle` (`quidproquo-dev-server`) is renamed to `awaitDevServerIdle` and moves from `implementations/queueImplementation` to `logic/inFlight/inFlightWork`. It is still exported from the package root, and now waits on kvs-stream projections and storage-drive handlers as well as queue messages, so the old name no longer described it. No shim is kept: rename the call.
- Every `*Implementation` function (`quidproquo-dev-server`: `apiImplementation`, `queueImplementation`, `webSocketImplementation`, `fileWatcherImplementation`, `fileStorageImplementation`, `kvsStreamImplementation`, `serviceFunctionImplementation`, `eventBusImplementation`) now **resolves once its subsystem is up**, returning a `DevServerPluginStop` (or `null` when it owns no resource), instead of never resolving. Four of them used to end in `await new Promise(() => {})` so a caller's `Promise.all` would not resolve; anything relying on that must now park itself. They are composed through the new internal `DevServerPlugin` contract (`DEV_SERVER_PLUGINS`), which is where a subsystem's teardown and its shutdown phase are declared.

## 0.1.18

- `askRouteAuthValidationDecode` (`quidproquo-webserver`) now returns a `RouteAuthDecodeResult` tri-state (`{ outcome: RouteAuthDecodeOutcome.notApplicable }` / `{ outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken }` / `{ outcome: RouteAuthDecodeOutcome.invalid }`) instead of `DecodedAccessToken | null`, and the action is now always yielded regardless of whether `routeAuthSettings.userDirectoryName` is set. A custom processor implementing this action must return the new shape (`notApplicable` for "no token auth configured", `invalid` for a failed/absent token, `valid` with `decodedAccessToken` on success) instead of `null`/a decoded token.

## 0.1.17

- `HTTPNetworkResponse` (`quidproquo-core`, returned by `askNetworkRequest`) gains a required `setCookies: string[]` field carrying every raw `Set-Cookie` line in order. Code constructing an `HTTPNetworkResponse` by hand must add this field (`[]` if not applicable).
- `askClaudeAiMessagesApi`, `ClaudeAiActionType`, `defineClaudeAI`, `ClaudeAIModelSize`, `ClaudeAIQPQConfigSetting`, `QPQConfigAdvancedClaudeAISettings`, and `getAllClaudeAiConfigs` (`quidproquo-core`) are removed with no direct replacement. Use the provider-agnostic `askAiPrompt`/`askAiPromptStream` actions with `defineAi` instead, or call the Anthropic API yourself via `askNetworkRequest`.
- `ConfigGetSecretErrorTypeEnum` (`quidproquo-core`) is removed; use `askConfigGetSecret.errorTypeEnum` instead (e.g. `askConfigGetSecret.errorTypeEnum.ResourceNotFound`).
- `ConfigGetSecretActionPayload`, `ConfigGetSecretAction`, `ConfigGetSecretActionProcessor`, and `ConfigGetSecretActionRequester` types (`quidproquo-core`) are removed; a processor should type its handler as `ProcessorFor<typeof askConfigGetSecret>` instead.

## 0.1.16

- `defineWebsocket`'s `uniqueKey` (`quidproquo-webserver`) changes from `` `${apiSubdomain}.${rootDomain}` `` to `apiSubdomain` alone. This is the setting's CDK construct/logical id, so a service redeploying after this change will rename (recreate) its WebSocket API resources; no code change is required, but expect a resource replacement on the next deploy.

## 0.1.15

- `defineEventDoc(options)` (`quidproquo-features`) is replaced by `defineEventDoc(functions, runtime, options)`: `functions` is the collection's `EventDocFunctions` object (`{ storeName, type, foldSnapshotViews, collectReferences, render? }` — a saved `EventDocDefinition` satisfies it directly), `runtime` is a `QpqFunctionRuntime` path to that same exported object, and `options` drops `storeName`/`type` (now read off `functions`) along with `eventValidator`, `eventRenderer`, `referenceResolver`, and `snapshotFold` (now members of `functions`, registered as a whole). `defineTenantedEventDoc` changes the same way. A collection with no functions object (no render/references/snapshots) should compose `defineEventDocSummary` + `defineEventDocRoutes` directly instead of calling `defineEventDoc`.
- `EventDocRoutesOptions` (the options `defineEventDocRoutes` takes) drops `eventValidator`, `eventRenderer`, `referenceResolver`, and `snapshotFold`. `GET {basePath}/{id}/render` and `GET {basePath}/{id}/references` are now always mounted and resolve their behaviour from the collection's registered `EventDocFunctions` object (looked up by `eventDocFunctionsName(storeName, type)`) instead of per-route inline-function names.
- `defineEventDocSummary`'s `options.snapshotFolds: Record<string, string>` is renamed to `options.snapshotFunctions`, and its values are now `defineDynamicFunctions` names (an `EventDocFunctions` object's registration) instead of `defineInlineFunction` names.
- `buildEventDocStore`'s options (`EventDocStoreOptions`) and the `EventDocStore` it returns drop `eventValidator`, `eventRenderer`, and `referenceResolver`.
- `EventDocTransferCollection` (`quidproquo-features`) drops `referenceResolver`. `defineEventDocTransfer`'s `collections` option now takes `EventDocTransferCollectionSource[]` instead of `EventDocTransferCollection[]` — each entry can be a live `EventDocFunctions` object, a collection-list entry carrying one under `functions`, or a bare `{ storeName, type, onPublish?, onAppend? }` registry entry.
- `EventDocDefinition.foldSnapshotViews` (the object `createEventDocDefinition` returns, `quidproquo-features`) now takes an optional second
  `seedViews: EventDocSnapshotViews` argument and returns `Nullable<EventDocSnapshotViews>` instead of `EventDocSnapshotViews`. A registered
  `snapshotFold` inline function that calls `definition.foldSnapshotViews(events)` and returns the result directly must widen its return type to allow
  `null` (it can now be invoked with just the log gap plus a prior snapshot's `seedViews`, and declines by returning `null` to force a from-scratch
  retry).
- `createEventDocDefinition`'s saved-doc config drops top-level `foldReducer`, `createInitialViewState`, and `migrations` in favor of `versions`: an
  array of `{ version, views }` entries, oldest first, where `views` is a map keyed by view name (every saved doc must declare a `document` view).
  The base entry's view supplies `{ foldReducer, createInitialViewState }`; every later entry's view supplies `{ foldReducer, migrateFromPrevious }`
  instead of a separate `migrations: { [version]: fn }` map. `schemaVersion` must equal the last entry's `version`, and every non-base entry must
  declare exactly the same view names as the base — both are now asserted at definition time instead of failing silently later.
- The object `createEventDocDefinition` returns no longer has a top-level `fold`; fold via `definition.views.document.fold(events)` (or
  `views.<name>.fold(events)` for any other declared view). Update every call site that used `definition.fold(events)`.
- `foldEventDocLogStep` (`quidproquo-features`) now returns `[state, accepted: boolean]` instead of just `state`. Callers assigning its return value
  directly must destructure the tuple.
- `buildVersionRoutedReducer` (`quidproquo-features`) now throws when an event's version has no registered reducer, instead of silently returning
  `[state, false]`. This should only surface a previously-inert bug (an incomplete version registration); there is no supported way to opt back into
  the silent-skip behavior.
- `createEventDocDefinition` now provides a built-in `summary` view on every definition, folded from the reserved lifecycle events. A `versions`
  entry that declares its own view named `summary` now throws at definition time; rename that view.
- `foldEventDocSummary(type, events)` (`quidproquo-features`) drops the `type` param: call it as `foldEventDocSummary(events)`. It now returns an
  `EventDocSummaryView` (no `type` field) instead of `EventDocSummary`; stamp `type` onto the result yourself if you need the stored shape.
- `createEventDocSummarySeed(type)` (`quidproquo-features`) drops the `type` param and now returns `EventDocSummaryView` instead of `EventDocSummary`.
- `eventDocSummarySchema` (`quidproquo-features`) is now the STORED shape (with `type`); the plain view (no `type`) is the new `eventDocSummaryViewSchema`/`EventDocSummaryView`. Code that validated a fold result without a `type` field against `eventDocSummarySchema` should switch to `eventDocSummaryViewSchema`.
- `EventDocAcceptance`, `createEventDocAcceptance`, and `recordEventDocAcceptance` (`quidproquo-features`) are removed with no replacement. Retry
  dedup and the schema-version floor are now read straight off the folded state (`EventDocDocument.recentClientMessageIds`, `schemaVersion`) instead
  of loop-local bookkeeping; there is nothing for a caller to construct or thread through anymore.
- `rejectEventDocEvent(event, state, acceptance, validators)` (`quidproquo-features`) drops the `acceptance` parameter: call it as
  `rejectEventDocEvent(event, state, validators)`.
- `foldEventDocLogStep`'s config (`FoldEventDocLogStepConfig`, `quidproquo-features`) drops the `acceptance` field; a step reads its acceptance rules
  off the `state` it is passed instead.
- `EventDocFunctions` / `EventDocDefinition` / `EventDocInvokableFunctions` (`quidproquo-features`) gain two new required members: `foldDocumentState:
  (events, seedState?) => unknown` (the latest-shaped document view at one point, resumable from a stored snapshot's document state) and
  `collectReferencesFromState: (state) => EventDocLink[]` (the links the current state depends on). Any hand-written `EventDocFunctions` object (not
  produced by `createEventDocDefinition`, which now supplies both automatically) must implement them.
- `EventDocRenderInput` (`quidproquo-features`) drops `events: EventDocEvent[]` in favor of `state: unknown` — a registered `render` function must
  read `input.state` (already folded, latest-shaped) instead of folding `input.events` itself.
- `EventDocOnAppendInput` and `EventDocOnPublishInput` (`quidproquo-features`) drop `events: EventDocEvent[]` in favor of `state: unknown` and a new
  `previousState: unknown` — a registered `onAppend`/`onPublish` inline function must read `input.state`/`input.previousState` (already folded,
  latest-shaped, snapshot-seeded) instead of folding `input.events` itself.
- `EventDocBackend` (`quidproquo-features`, the object `createEventDocBackend` returns) renames `askEventsAsOf(id, clock)` to
  `askDocumentStateAsOfTime(id, clock)` and adds `askDocumentStateLatest(id)`; both now return `Nullable<EventDocDocumentStateAtEvent>`
  (`{ eventId, state }`) instead of `EventDocEvent[]`. `askPublishedEventsAsOf` is removed with no replacement — use `askPublishedVersionAsOf` and
  read `.state` instead. `askPublishedVersionAsOf` now returns `Nullable<EventDocVersionState>` (`{ version, state }`) instead of
  `Nullable<EventDocVersionSlice>` (`{ version, events }`).
- `askEventDocEventsAsOf`, `askEventDocPublishedEventsAsOf`, and `askEventDocSnapshotAtEvent` (`quidproquo-features`) are removed. Use
  `askEventDocDocumentStateAsOfTime`/`askEventDocDocumentStateLatest`/`askEventDocDocumentStateAsOf` (return folded state, not raw events) and
  `askEventDocProjectAtEvent` respectively.
- `askEventDocPublishedVersionAsOf` (`quidproquo-features`) now returns `Nullable<EventDocVersionState>` (`{ version, state }`) instead of
  `Nullable<EventDocVersionSlice>` (`{ version, events }`).
- `askEventDocReferences` (`quidproquo-features`) is now the full-history walk only (used by the transfer export); the references route uses the
  new `askEventDocReferencesFromState(docId)` instead. A caller that wants "what does the document reference right now" should switch to the new
  function.
- `EventDocVersionSlice` (`quidproquo-features`, `{ version, events }`) is replaced by `EventDocVersionState` (`{ version, state }`).
- `EventDocWorkspaceTransport` (`quidproquo-features`) gains a required `askFetchEventsPage: (identity, request?) => AskResponse<QpqPagedData<EventDocEvent>>`
  member — the history panel's paged, newest-first read. A hand-written transport must implement it alongside the existing `askFetchEvents`.
- `EventDocWorkspaceBuiltInApi` (`quidproquo-features`) gains a required `askLoadOlderHistory: (slotKey?) => AskResponse<void>` member.
- `EventDocWorkspaceState.fullHistory` (`quidproquo-features`) changes from `Record<string, Nullable<EventDocEvent[]>>` to
  `Record<string, Nullable<EventDocWorkspaceHistoryPage>>` (`{ events, nextPageKey? }`, newest-first, paged) — code reading a slot's `fullHistory`
  directly as an event array must read `.events` instead.
- `askUIEventDocWorkspaceSetFullHistory(slotKey, events)` (`quidproquo-features`) is now `askUIEventDocWorkspaceSetFullHistory(slotKey, history)`,
  taking `Nullable<EventDocWorkspaceHistoryPage>` instead of `Nullable<EventDocEvent[]>`. `EventDocWorkspaceSetFullHistoryEffect`'s payload renames
  `events` to `history` with the same type change.

## 0.1.14

- `EventDocSavedDefinitionConfig.validate?: EventDocEditorValidator` (`quidproquo-features`, the config passed to `createEventDocDefinition`) is
  replaced by `validators?: EventDocEventValidators<TView>`, a registry keyed by event type (`(event, state) => Nullable<string>`, `state` being the
  folded view) rather than one function over the raw event list. Convert a hand-written `validate` into per-type entries; the universal lifecycle
  guard is now composed in automatically (merged with the supplied `validators`, or applied alone if `validators` is omitted) instead of being
  something a custom `validate` had to reimplement or call into.
- `EventDocEditorValidator` (`quidproquo-features`) changes shape from `(event, events: EventDocEvent[]) => Nullable<string>` to
  `(event, state: unknown) => Nullable<string>`: it now receives the already-folded document state instead of the raw event log. A hand-written
  validator that folded its own list must fold once upstream and pass the state through instead.
- `createEventDocEventValidator(fold, domainValidators)` (`quidproquo-features`) drops the `fold` parameter: call it as
  `createEventDocEventValidator(domainValidators)`. The returned validator now takes the folded state directly (see `EventDocEditorValidator` above)
  rather than folding the event log itself.
- `EventDocWorkspaceTransport` (`quidproquo-features`) gains a required `askFetchBootstrap: (identity) => AskResponse<{ base, events }>` member. A
  hand-written transport (anything other than the built-in `eventDocWorkspaceApiTransport`) must implement it: the opening load's newest fold base
  plus the events after it, or `{ base: null, events }` with the whole log when there is no usable base.
- `EventDocUnsavedDefinitionConfig.validate` is removed with no replacement; unsaved (session-only) docs no longer accept a validator.
- The reserved lifecycle guard (and any `validators` supplied) is now enforced by the fold itself, not just the editor pre-flight — a document
  folded from a stored log that contains an event the guard rejects (e.g. an edit appended after publish) now ignores that event instead of applying
  it. Code relying on the fold applying every event in the log regardless of legality should re-check folded output against expectations.
- `defineQueue`'s `batchWindowInSeconds` default changes from `5` to `0` (invoke as soon as a message arrives). A queue that relied on the implicit
  5-second default to accumulate a batch must now pass `batchWindowInSeconds` explicitly.
- The event-doc collection list route (`GET {basePath}`, mounted by `defineEventDocRoutes`) now returns `QpqPagedData<EventDocSummary>`
  (`{ items, nextPageKey? }`) instead of a bare `EventDocSummary[]`, and accepts `?limit=`/`?nextPageKey=` query params. Any direct HTTP consumer of
  this route must read `.items` and page on `nextPageKey`.
- `askEventDocListFetch` (`quidproquo-features`) now returns `QpqPagedData<EventDocSummary>` instead of `EventDocSummary[]`, and takes a third
  `options?: { limit?, nextPageKey? }` argument. Callers that want the full collection should switch to the new `askEventDocListFetchAll`, which
  preserves the old all-in-one-array behavior by paging internally.
- The event-doc list frontend state module (`quidproquo-features`' `eventDoc/list`) moves from numbered pages to cursor-based paging:
  - `EventDocListState.page: number` is replaced by `pageIndex: number`, `cursors: Nullable<string>[]`, and `nextPageKey: Nullable<string>`.
  - `EventDocListEffect.SetItems` / `SetPage` are renamed to `PageLoaded` / `SetPageIndex`, with corresponding payload/effect type renames
    (`EventDocListSetItemsEffect` → `EventDocListPageLoadedEffect`, `EventDocListSetPageEffect` → `EventDocListSetPageIndexEffect`).
  - `askUIEventDocListSetItems` / `askUIEventDocListSetPage` and `askEventDocListSetPage` are removed; use `askUIEventDocListPageLoaded` and the new
    `askEventDocListNextPage` / `askEventDocListPreviousPage` (exposed on `sharedEventDocListApi`) instead of jumping to a numbered page.
  - `clampEventDocListPage` is removed with no replacement — paging validity is now driven by `nextPageKey`, not a clamped page number.

## 0.1.13

- `EventDocStoredEvent` in `quidproquo-features` gains a required `type: string` field (the collection type, denormalised onto every stored row).
  `eventDocEventToStoredEvent(modelId, event)` correspondingly becomes `eventDocEventToStoredEvent(modelId, type, event)`. Update any code
  constructing `EventDocStoredEvent` directly or calling `eventDocEventToStoredEvent`.
- The event-doc summary is no longer rederived synchronously on append. Appending an event now only writes the log; the summary row is rebuilt
  asynchronously by a `defineKeyValueStore` `onStream` handler on the events table. Code that reads a document's summary immediately after
  `askEventDocEventAppend` may briefly see stale data — re-read after a short delay, or fold the log directly, if you need the summary to reflect the
  just-appended event.
- Event-doc event ids move from a numeric counter to a sortable string id (UUIDv7). `EventDocEventMetadata.index: number` is renamed to
  `eventId: string`; `EventDocVersion.eventIndex: number` is renamed to `eventId: string`; `EventDocLink`'s `Exact` variant's `eventIndex: number` is
  renamed to `eventId: string`; `EventDocStoredEvent.sk` changes from `number` to `string`. Update any code reading/writing these fields, and compare
  with `<`/`<=` rather than arithmetic.
- `EventDocEventListOptions.afterIndex?: number` (used by `askEventDocEventList` in `quidproquo-features`) is renamed to `afterEventId?: string`. The
  `?afterIndex=` query param on the list-events route is renamed to `?afterEventId=` too; update callers on both ends.
- `askEventDocSoftDelete(id, updatedBy)` in `quidproquo-features` now requires a third `schemaVersion: number` argument:
  `askEventDocSoftDelete(id, updatedBy, schemaVersion)`. Soft delete is now recorded as a `DELETE` event rather than a direct write to `deletedAt`,
  and every event carries the caller's schema version.
- `askEventDocRestore(id, updatedBy, schemaVersion)` is added to `quidproquo-features` to undo a soft delete by appending a `RESTORE` event; there was
  previously no restore path since `deletedAt` had to be cleared by hand.
- `renumberWorkspaceEvents` is removed from `quidproquo-features`' `eventDoc/workspace/reducer` exports with no replacement. Committed workspace
  events now mint a real sortable id at commit time instead of being re-stamped with a provisional sequential index.
- `quidproquo-web-react`'s runtime is rewritten from a `jotai`-backed atom store to an internal refcounted `QpqStore`; the `jotai` dependency is
  dropped. Any app using `createQpqRuntimeDefinition`/`useQpqRuntime`/`createQpqRuntimeComputed`/`useQpqRuntimeComputed` must update as below, and
  wrap the app tree in a `QpqStoreProvider` (`<QpqStoreProvider store={createQpqStore()}>...</QpqStoreProvider>`) — runtimes throw if bound outside
  one.
- `createQpqRuntimeDefinition(api, initialState, reducer?)` is now
  `createQpqRuntimeDefinition({ uniqueName, api, initialState, reducer?, onInit?, getActionProcessors? })`: a single options object, with a new
  required `uniqueName` (namespaces the area in the store — federated modules that bind the same name share state) and optional `onInit` (a story run
  once on the area's first bind, replacing the `mainStory` argument previously passed to `useQpqRuntime`).
- `useQpqRuntime(definition, mainStory?, name?, getActionProcessors?)` is now `useQpqRuntime(definition, instanceName?, getActionProcessors?)`: the
  `mainStory` argument is removed (move that story to the definition's `onInit`); the remaining `name`/`getActionProcessors` params shift down a
  position.
- `createQpqRuntimeComputed(definition, compute)` now returns a `{ definition, compute }` object instead of a callable `(name?) => atom` function;
  code that invoked the returned value as a function must stop doing so (`useQpqRuntimeComputed` still takes the computed value directly).
- Runtime state is refcounted per area/instance and deleted immediately when its last consumer unmounts, instead of persisting for the page's lifetime
  like a jotai atom. Code relying on state surviving a full unmount/remount cycle must persist it elsewhere (e.g. the store, a parent-level binder).
- `quidproquo-web-react`'s deep import path `hooks/asmj/*` is removed; the same exports (`createQpqRuntimeDefinition`, `useQpqRuntime`,
  `QpqMappedApi`, `QpqRuntimeEffectCatcher`, etc.) are still available from the package root, now sourced from `runtime/`, `qpqContext/`, and
  `store/`.

## 0.1.12

- `GraphDatabaseNeo4jQPQConfigSetting` is removed from `quidproquo-neo4j` with no replacement. It was never used by the package
  (`defineGraphDatabaseNeo4j` doesn't return it); delete any import of it.
- `EventDocListConfig` (and `askUIEventDocListSetConfig`'s payload) requires a new `canTransfer: boolean` field. Existing callers must add it
  explicitly: `true` to show Export/Import on that list, `false` otherwise.
- `EventDocListItem` requires a new `type: string` field (the collection's event-doc type). Code constructing `EventDocListItem` values directly
  (outside `toEventDocListItem`) must supply it.
- `EventDocBundleApplyOptions` in `quidproquo-features` requires a new `importerUserId: string` field. Callers of
  `askEventDocBundleApply`/`askEventDocBundleApplyDoc` must pass the importing user's id; every imported event's `createdBy.userId` is rewritten to it
  (the original `userDisplayName` is kept).
- `askEventDocWriteForeignEvents(docId, events, fromIndex, logRewritten?)` in `quidproquo-features` is now
  `askEventDocWriteForeignEvents(docId, events, fromIndex, { importerUserId, logRewritten? })`. Pass the importing user's id in the new required
  options object instead of a trailing boolean.
- `ApiRequestActionProcessorOptions.getHeaders` in `quidproquo-actionprocessor-web` now returns `Nullable<Record<string, string>>` instead of
  `Record<string, string> | undefined`. A `getHeaders` callback that returned `undefined` for "no headers" must return `null`.
- `getStateMachineByName` in `quidproquo-xstate` now returns `Nullable<StateMachineQPQConfigSetting>` — `null` instead of `undefined` when no machine
  matches. Update any `=== undefined` checks to `null` (truthiness checks are unaffected).
- `askStateMachineSendEvent` in `quidproquo-xstate` now fails with `ErrorTypeEnum.BadRequest` when the machine has already reached a final state
  (previously it silently succeeded), and valid self/internal transitions that keep the same state value are now accepted instead of wrongly rejected
  as `BadRequest`.
- `StateMachineEvent` in `quidproquo-xstate` narrows its extra-field index signature from `any` to `unknown`. Guard/action stories reading payload
  fields off the event must narrow or cast before use.
- `storyLogger`, `storyLoggerFs`, `getS3Logger`, `getS3LoggerViaExtension`, and `moveLogsToPerminateStorage` are removed from
  `quidproquo-actionprocessor-awslambda`. Use `getLogger(qpqConfig)` (unchanged) to build a story logger; the lower-level helpers have no replacement.
- `viewerRequestEventHandler` is removed from `quidproquo-actionprocessor-awslambda`. Call `getCloudFrontRequestEvent_viewerRequest()` to get the
  handler instead.
- The `QpqWarmLambdaEvent` type (`{ qpqWarm: boolean }`) is removed from `quidproquo-actionprocessor-awslambda`; warm invokes arrive as SNS warmer
  records (use `isSnsWarmerRecord` to detect them). `QpqFunctionExecutionEvent<T>` is unchanged.
- `findMatchingCertificates` and `getDomainValidationOptions` (deep imports from `quidproquo-actionprocessor-awslambda`'s `logic/acm`) are removed
  with no replacement.
- `getDefaultAppName` in `quidproquo-deploy-rspack` now returns `Nullable<string>`: `null` instead of `undefined` when no app is found. Update any
  `=== undefined` checks to `null` (truthiness checks are unaffected).
- `getGuidProcessor` in `quidproquo-actionprocessor-js` is renamed to `getGuidActionProcessor`. Update imports; behavior is unchanged.

## 0.1.11

- `askSetMaintenanceMode` and the admin `POST /maintenance/set` route (built by the now-removed `defineAdminServiceMaintenanceRoute`) are removed from
  `quidproquo-features`. Maintenance mode is now an event-doc collection (`defineEventDoc`) mounted at `/maintenance`, with a full CRUD API and an
  update-log model, instead of a single begin/end toggle. There is no direct functional replacement for `askSetMaintenanceMode`; drive maintenance
  windows through the new `/maintenance` routes (or the admin dashboard's maintenance UI) instead.
- `WebSocketQueueMaintenanceLevel`, `WebSocketQueueServerEventPayloadMaintenance`, and `WebSocketQueueServerEventMessageMaintenance` are removed from
  `quidproquo-features`. The application WebSocket now broadcasts `MaintenanceServerEventMessage` (payload
  `{ maintenances: MaintenancePublicState[] }`, replacing the whole active set on every change) under the same
  `WebSocketQueueServerMessageEventType.Maintenance` event type, instead of a single `{ active, level, message }` toggle. Update any frontend
  listening for that event type to read the new list-based payload.
- `createEventDocWorkspace`'s returned shape changes in `quidproquo-features`: per-slot verbs move from `api.<slotKey>.<verb>` to
  `docs.<slotKey>.api.<verb>`, and the built-in `init`/`save`/`cancel`/`refresh` verbs move from `api.workspace.<verb>` to `api.<verb>` directly
  (`workspace` is no longer a reserved/nested key). Per-slot `selectors.view/liveEvents/slotState[<slotKey>]` move to
  `docs.<slotKey>.view/liveEvents/slotState`; `.selectors` now only exposes the cross-doc aggregates `isDirty`/`isLoading`/`isSaving`/`error`. Update
  call sites to the new `docs.<slotKey>` shape.
- `EventDocWorkspaceDefinition.selectors` (passing a pre-built `createEventDocWorkspaceSelectors` instance into `createEventDocWorkspace`) is removed;
  the workspace always builds its own selectors now. Drop the `selectors` field from any workspace definition.
- `createEventDocWorkspaceSlot(foldConfig, api)` is removed from `quidproquo-features`. Use
  `createEventDocDefinition({ schemaVersion, foldReducer, createInitialViewState, migrations?, coalesceEventTypes?, validate?, api })` for a saved doc
  (drop the old `kind` field), or add `saved: false` for a local/unsaved slot. A saved definition now auto-merges the generic
  `askEventDocSetCode`/`askEventDocSetName`/`askEventDocCreateDraft`/`askEventDocPublish` verbs into `api` — remove them from a hand-written api or
  `createEventDocDefinition` throws.

## 0.1.10

- `ApiActionType`, `ApiRequestActionRequester` (`askApiRequest`), and its request/response types move from `quidproquo-web` to `quidproquo-webserver`.
  Update imports from `quidproquo-web` to `quidproquo-webserver`. The action type string also changed from `@quidproquo-web/Api/Request` to
  `@quidproquo-webserver/Api/Request`; any code matching on the raw string must update too.
- `InitStateEffect`, `SetCodeEffect`, `SetNameEffect`, `CreateDraftEffect`, and `PublishEffect` are removed from `quidproquo-features`, replaced by
  `EventDocInitStateEffect`, `EventDocSetCodeEffect`, `EventDocSetNameEffect`, `EventDocCreateDraftEffect`, and `EventDocPublishEffect`. The new types
  carry the plain event data (e.g. `Effect<EventDocEffect.SetCode, EventDocSetCodeData>`) instead of data pre-wrapped in `EventDocEventPayload`;
  update any direct imports to the new names and unwrap accordingly.
- `askUIEventDocWorkspaceApplyEvent(slotKey, isPending, event)` in `quidproquo-features` drops the `isPending` argument
  (`askUIEventDocWorkspaceApplyEvent(slotKey, event)`); `EventDocWorkspaceApplyEventPayload` and `EventDocWorkspaceSlotBinding` correspondingly lose
  their `isPending` field. Every commit, including local slots like chrome, now lands in the slot's `pending` buffer instead of `history` (a local
  slot's pending simply never saves) — code reading a local slot's `state.history` directly must read `state.pending` instead.
- `EventDocWorkspaceState` in `quidproquo-features` gains a required `historyViews: Record<string, unknown>` field (the incrementally-folded history
  accumulator per slot, maintained by the reducer). Any hand-constructed `EventDocWorkspaceState` must add it, and
  `createInitialEventDocWorkspaceState`/`createEventDocWorkspaceReducer` now take the workspace's slot configs (`EventDocWorkspaceSlotsConfig`)
  instead of `string[]` slot keys / a precomputed coalesce-rules record, respectively — update any direct callers to pass the slots config.
- `selectEventDocWorkspaceIsDirty` and `selectEventDocWorkspaceIsSaving` are removed from `quidproquo-features`; use a workspace's own
  `selectors.isDirty`/`selectors.isSaving` instead. Both now count document slots only, so a local slot's pending (e.g. a chrome toggle) no longer
  marks the workspace dirty.
- `foldSlotHistory` is removed from `quidproquo-features`' `eventDoc/workspace/logic` exports. Read a slot's stored history fold via
  `getSlotHistoryView` (the raw, not-yet-latest-migrated accumulator) or a workspace's `selectors.view` (pending-folded and migrated to latest)
  instead.
- `EventDocWorkspaceSlotState.error`, a workspace's `selectors.error`, and `askUIEventDocWorkspaceSetError`'s `error` argument in
  `quidproquo-features` change from `Nullable<string>` to the typed `Nullable<EventDocWorkspaceSlotError>`
  (`{ operation: EventDocWorkspaceSlotOperation, error: QPQError }`). Code reading a slot/workspace error as a display string must instead read
  `error.error.errorText` (or branch on `error.operation`/`error.error.errorType`); `askUIEventDocWorkspaceSetError` callers must pass the typed shape
  instead of a string.
- `askUIEventDocWorkspaceClearError(slotKey)` is added to `quidproquo-features` as the way to clear a slot's error; passing `null` to
  `askUIEventDocWorkspaceSetError` no longer clears it.
- `EventDocWorkspaceState` in `quidproquo-features` gains a required `transient: Record<string, Record<string, EventDocEvent[]>>` field (per-slot,
  per-transientKey groups of never-saved events). Any hand-constructed `EventDocWorkspaceState` must add it; `createInitialEventDocWorkspaceState`
  seeds it automatically.
- `qpq check:circular` (`quidproquo-cli`) and the rspack circular-check plugin (`quidproquo-deploy-rspack`) now fail by default instead of only
  warning: found cycles exit the CLI with code 1 / push a compilation error instead of a warning. The old `--error` flag / `QPQ_CIRCULAR_DEPS_ERROR`
  env var are replaced by `--warn` / `QPQ_CIRCULAR_DEPS_WARN`, which downgrades cycles back to a non-failing report. Remove any CI step that relied on
  the command/build succeeding despite cycles, or pass `--warn` / set `QPQ_CIRCULAR_DEPS_WARN=1` temporarily while fixing them.

## 0.1.9

- The eventDoc render route (`GET {basePath}/:id/render`) in `quidproquo-features` now actually honors `renderMode=published`: it resolves the version
  effective as of `effectiveAt` (or now) and truncates the log to that version's slice, throwing `NotFound` if nothing is published, instead of always
  returning the full draft log regardless of `renderMode`. `EventDocRenderInput` also gains an optional `version?: EventDocVersion` field carrying the
  resolved version (undefined for draft renders) — a custom `eventRenderer` inline function that resolves its own links can read `version.publishedAt`
  instead of guessing a clock.
- `defineTenant` in `quidproquo-features` now requires a `myTenantsBasePath: string` field alongside `basePath`. The stock eventDoc CRUD
  (list/get/events/render/remove) now mounts at `{basePath}` instead of `{basePath}/docs`; the membership-gated routes (list mine / create /
  get-record / get-logo) move from `{basePath}` to `{myTenantsBasePath}` and `POST {basePath}` (stock create) is no longer mounted — creating a tenant
  is only reachable via `POST {myTenantsBasePath}`. Update route callers and add the new option.

## 0.1.8

- `AiStreamFinish.finishReason` and `AiStreamFinishStep.finishReason` in `quidproquo-core` narrow from `string` to the new `AiStreamFinishReasonEnum`
  (`stop`, `length`, `contentFilter`, `toolCalls`, `error`, `other`, `unknown`). Update any string comparisons (e.g. `finishReason === 'tool-calls'`)
  to use the enum member (`AiStreamFinishReasonEnum.toolCalls`); an unrecognized reason now maps to `unknown` instead of passing the raw string
  through.
- `defineTenant`'s `tenants` event-doc collection in `quidproquo-features` is now scope-resolved (`TENANT_SCOPE_RESOLVER_FN`) instead of unscoped.
  `POST {basePath}` / `GET {basePath}` and the generic `{basePath}/docs` CRUD now run within the request's scope (the caller's personal partition, or
  the active tenant named by the tenant header) instead of a single global namespace — a tenant doc is only reachable from the scope it was created
  in. Cross-scope listing of other memberships now reads the published `TenantRecord` registry instead of the doc store.
- `QpqCoreKeyValueStoreConstruct.authorizeActionsForRole`, `QpqCoreParameterConstruct.authorizeActionsForRole`,
  `QpqCoreSecretConstruct.authorizeActionsForRole`, and `QpqCoreStorageDriveConstruct.authorizeActionsForRole` in `quidproquo-deploy-awscdk` now take
  a leading `scope: Construct` argument. Pass the enclosing stack/construct (e.g. `this`) as the first argument at each call site.
- `TenantDocument`, `TenantRecord`, and `TenantSetBrandData` in `quidproquo-features` replace `logoUrl?: string` with `logo?: EventDocAssetRef`
  (`{ guid, filename, mimetype }`). Pass the uploaded asset ref when setting the tenant logo instead of a URL; resolve it to a URL at read time.
- `TenantDocument`, `TenantRecord`, and `TenantSetBrandData` in `quidproquo-features` narrow `brandColors` from `Record<string, string>` to the strict
  `TenantBrandColors` shape (`{ primary: string; secondary: string }`), and it's now optional (an unbranded tenant folds to `undefined` instead of
  `{}`). Pass both `primary` and `secondary` together when setting brand colors; arbitrary color keys are no longer accepted.
- `defineTenant` in `quidproquo-features` now requires an `owner: { module: string }` field. Declare it identically in every service that needs tenant
  support (not just the service that used to own it) — the registry (stores, publish sync, routes) only materializes on the owner's deploy; every
  other service gets just the scope resolver and a cross-module reference to the membership table.
- `defineTenantScopeResolver` is removed from `quidproquo-features`. Replace any standalone `defineTenantScopeResolver()` /
  `defineTenantScopeResolver(linksOwner)` call with `defineTenant({ ...options, owner })` — it now registers the scope resolver, connection-scope
  validator, and membership-table reference itself.
- `defineTenantStores()` in `quidproquo-features` no longer includes the `userTenantLinks` key-value store (it's now declared by `defineTenant`
  itself, shared across owner and non-owner services). If you called `defineTenantStores()` directly for the membership table, use `defineTenant`
  instead.
- The KVS scope delimiter changed from `::` to `@@QPQSCOPE@@` (`KVS_SCOPE_DELIMITER` in `quidproquo-core`), and the character reserved in scope
  segments changed from `:` to `@`. Scope segments containing `:` are now allowed; scope segments containing `@` are now rejected. Raw partition-key
  values containing `::` are now allowed (they no longer collide with the delimiter, e.g. qpq function-runtime correlation ids like `path::method`),
  but values containing `@@QPQSCOPE@@` are now rejected. Any scoped rows written under the old `tenant::key` composition are unreadable through the
  scoped translator until re-composed under the new delimiter.
- `askUserDirectoryAuthenticateUser(name, false, email)` in `quidproquo-core` now throws `UserDirectoryAuthenticateUserErrorTypeEnum.InvalidPassword`
  up front when the password is missing or empty, instead of sending `password: undefined` to the processor (which the dev server accepted, minting a
  token for a password-less login, and which AWS surfaced as an unmapped Cognito error). Pass a non-empty password for standard sign-ins.
- `askFileReadTextContents` and `askFileReadObjectJson` on a missing file now return their own action-typed `FileNotFound` error instead of
  `ErrorTypeEnum.NotFound` (node) or a `GenericError` wrapping `[NoSuchKey]` (AWS). `askFileReadObjectJson` on unparseable JSON now returns
  `InvalidJson` instead of `GenericError`. If you match on the old errorType strings, update to the new members.
- The dev server (`quidproquo-actionprocessor-node`) now rejects temporary secure-URL expirations over 7 days with `ExpirationTooLong`, matching the
  AWS processor and the documented cap. Previously it signed unbounded-lifetime URLs.
- `askUserDirectoryRequestEmailVerification` on AWS now resolves to the `AuthenticationDeliveryDetails` the core type always declared, instead of
  `undefined` (the Cognito processor was dropping the delivery details).
- `askUserDirectorySetAccessToken` on AWS now fails with a typed `ErrorTypeEnum.Unauthorized` for an undecodable/forged token instead of letting a raw
  `GenericError` (with the internal decode message) escape; the session is left untouched on failure.
- `getStoryNameFromQpqFunctionRuntime` in `quidproquo-core` now throws `InvalidQpqFunctionRuntimeError` when a string runtime has no
  `::<functionName>` suffix, instead of returning `undefined` (which became the literal "undefined" in deployed resource names). Only reachable from
  untyped/JS callers; TypeScript already rejected such strings.
- `getValidQpqIsoDateTime` in `quidproquo-core` now rejects shape-valid but impossible instants (e.g. `2024-02-30T...`, month 13, hour 25) by
  round-tripping through `Date` in addition to the regex.
- Story failures inside `qpqPromisify`/ExecuteStory now surface the nested action's original errorType (e.g. `NotFound`) instead of always
  `GenericError`, and the "Error in qpqPromisify: Error:" double prefix is gone. Non-returnErrors action failures throw the new exported
  `QpqPromisifyActionError` (readonly `code`, carries the structured QPQError).
- The `addDays/addMonths/addYears/addDayMonthYearToTDateIso` helpers in `quidproquo-core` now compute in UTC. Results change only on hosts running a
  non-UTC timezone across a DST boundary (previously nondeterministic per host; on Lambda/UTC nothing changes).
- `askMapParallelBatch` / `askFlatMapParallelBatch` now throw `InvalidBatchSizeError` for a batch size below 1 (or NaN) instead of looping forever.
  The callback's `index`/`srcArray` args are now relative to the original array, matching `askMap`.
- `askKeyValueStoreQuerySingle` now returns the first item collected across all pages; previously it returned the first item of the last page, so with
  `limit > 1` it could return the wrong item or a spurious `null`.
- `askKeyValueStoreUpdatePartialProperties` now throws `InvalidKvsPartialPropertyError` for values that cannot be stored (Dates, Maps, nested
  non-plain objects) instead of silently dropping them; `isValidKvsAdvancedDataType` correspondingly rejects non-plain objects. It also gained an
  optional trailing `options` param (tenant scope), as did `askKeyValueStoreScanAll`.
- Unscoped KVS access on string-pk stores now rejects primary-key values containing the reserved `::` delimiter (get/update/delete key, upsert item
  pk, query pk-condition values) with `InvalidScopeError` (`reservedDelimiter`), instead of silently reading or writing rows that belong to a tenant
  scope. Any pre-existing unscoped data whose pk contains `::` is now unreachable through the API (it was already hidden from unscoped scans).
- Scope segment `'.'` is now rejected by `validateScopeSegment` for both File and KVS actions (it previously resolved to the unscoped storage root on
  path-resolving backends).
- The dev-server KVS get/update/delete/upsert/query processors now resolve the store config up front like production DynamoDB, so an undeclared store
  fails with the typed StoreNotFound on every operation rather than only scoped ones.
- Inline function executions (`QpqRuntimeType.EXECUTE_STORY`, e.g. `askInlineFunctionExecute`) now inherit the caller's `functionGlobals`, merged
  under the callee's own registered globals. Previously an inline function only ever saw its own registered globals. If you relied on inline functions
  being isolated from the caller's globals, re-check for now-visible values.
- `quidproquo-core`'s test harness (`runStory`/`storyTesting`) no longer throws `TestSetupError` for an unmocked `ContextActionType.Read` action — it
  now resolves to the context identifier's `defaultValue`, matching production behavior. Tests asserting on that throw for an unmocked context read
  need to mock the value explicitly or expect the default instead.
- `quidproquo-webserver`'s websocket queue authenticate flow: a failed `askUserDirectorySetAccessToken` (or an invalid tenant/scope claim) now runs
  the full unauthenticate path (clearing `userId`/`accessToken`/`tenantId` on the connection record) instead of just sending an `Unauthenticated`
  reply while leaving the stored connection untouched. If you relied on the connection record retaining its previous identity/scope after a failed
  re-authenticate, it's now cleared.
- New `quidproquo-deploy-rspack` package added, an rspack-based build (`getRspackConfig`/`getAllRspackConfig`, `getRspackConfigForQpqRemote`,
  `getRspackBuildMode`/`RspackBuildMode`, `setupRspackQPQRuntime`) with the same API shape as `quidproquo-deploy-webpack`, for consumers who want
  rspack instead of webpack. `quidproquo-deploy-webpack` itself is unchanged and still targets webpack.
- `EventBusQPQConfigSetting` and `QueueQPQConfigSetting` in `quidproquo-core` now have a required `isFifo: boolean` field. If you construct these
  settings directly (rather than via `defineEventBus` / `defineQueue`), add `isFifo: false` to existing literals.
- `defineAdminSettings`, `defineAdminUserDirectory`, and `adminUserDirectoryResourceName` move from `quidproquo-webserver` to `quidproquo-features`.
  Same signatures — import from `quidproquo-features` instead, and add it as a dependency if you don't already have it.
- The websocket queue feature (`defineWebSocketQueue`, `defineStateDispatchOverWebsockets`, `websocketConnectionInfoContext`, the service-request
  action requesters, and all `WebSocketQueue*` types) and the admin log service (`defineAdminServiceAuthRoute`, `defineAdminServiceLogRoute`,
  `defineAdminServiceLogLogRoute` and their supporting logic) move from `quidproquo-webserver` to `quidproquo-features`. Same signatures — import from
  `quidproquo-features` instead, and add it as a dependency if you don't already have it.
- Bootstrap VPCs deployed via `quidproquo-deploy-awscdk` now get VPC flow logs to CloudWatch (`/qpq/vpc-flow-logs/{vpcName}`, 365-day retention) and
  free S3/DynamoDB gateway endpoints by default on next deploy. Opt out per-network with
  `defineAwsVirtualNetworkSettings(virtualNetworkName, { flowLogs: { disable: true }, disableS3GatewayEndpoint: true, disableDynamoDbGatewayEndpoint: true })`
  from `quidproquo-config-aws`. Same setting also exposes opt-in `interfaceEndpoints`, `natGateways`, and `maxAzs` overrides (`natGateways: 0` is
  rejected).
- `defineBootstrapBudget` and `defineBootstrapCloudTrail` from `quidproquo-config-aws` are renamed to `defineAccountBudget` and
  `defineAccountCloudTrail` (same signatures), and their resources are no longer deployed by the bootstrap stack — deploy them via a new dedicated
  account stack (`AccountQpqStack` from `quidproquo-deploy-awscdk`) using an account-only config (`defineApplication` +
  `defineAwsServiceAccountInfo` + `defineAccount*` settings, no module). `defineAccountSecurityServices` (GuardDuty/Security Hub, both opt-in) is new
  and deploys from the same account stack.
- Data stores deployed via `quidproquo-deploy-awscdk` (storage-drive S3 buckets, key-value-store DynamoDB tables, Cognito user pools, Neptune graph DB
  clusters) now default to `RETAIN` (Neptune: `SNAPSHOT`) instead of `DESTROY` on `cdk destroy`/replacement, and S3 buckets no longer
  `autoDeleteObjects` by default. If you rely on full teardown (e.g. ephemeral dev/test environments), declare
  `defineAwsDataStoreRemovalPolicy(AwsDataStoreRemovalPolicy.destroy)` from `quidproquo-config-aws` in that environment's config.
- `quidproquo-eslint-config`'s shared config now lints `.jsx`/`.tsx` files and enforces `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, and
  `eslint-plugin-prettier` rules. Consumers now need `prettier` installed (peer dep) and may see new lint failures on JSX files and formatting-only
  diffs.
- `DateNowActionProcessor`/`DateNowActionRequester` in `quidproquo-core` now resolve to `QpqIsoDateTime` instead of `string`. If you implement
  `DateNowActionProcessor` yourself, return `getQpqIsoDateTimeFromDate(date)` instead of `date.toISOString()`.
- `AuthenticationInfo.expiresAt` in `quidproquo-core` is now typed `QpqIsoDateTime` instead of `string`. Still a plain ISO string at runtime;
  construct it with `getQpqIsoDateTimeFromDate` instead of a raw `.toISOString()`.
- `preformNetworkRequest` is removed from `quidproquo-web`. Import it from `quidproquo-webserver` instead (same signature).
- `generateUUID` is removed from `quidproquo-webserver`. Use `generateUuid` from `quidproquo-core` instead (same v4 UUID, note the lowercase `uuid`).
- `QpqLogger.log` in `quidproquo-core` now returns `void` instead of `Promise<void>` — it fires the write off in the background. If you awaited or
  chained on `logger.log(result)`, drop the `await`/`.then` and call `logger.waitToFinishWriting()` when you need to know writes have flushed.
- `QPQ_LOG_EXTENSION_PORT` is removed from `quidproquo-actionprocessor-awslambda`. The log-extension port is now hardcoded internally on both ends —
  delete any import of it.
- `askRespondToAuthChallenge(username, challenge, session, newPassword)` in `quidproquo-webserver` is now
  `askRespondToAuthChallenge(authChallenge: AnyAuthChallenge)`. Pass a single challenge object, e.g.
  `{ challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED, username, session, newPassword }`.
- `UserDirectoryQPQConfigSetting` in `quidproquo-core` now has a required `mfa: UserDirectoryMfaSettings` field
  (`{ mode: UserDirectoryMfaMode; secondFactors?: UserDirectoryMfaSecondFactor[] }`). If you construct this setting directly (rather than via
  `defineUserDirectory`), add `mfa: { mode: UserDirectoryMfaMode.off }` to existing literals.
- `askFileExists` no longer returns `false` for every failure. It still returns `false` when the file genuinely does not exist (S3 404 / `ENOENT`),
  but a permission failure now raises a `FileExistsErrorTypeEnum.AccessDenied` error instead of silently returning `false`. If you relied on `false`
  meaning "missing or inaccessible", handle the error case.
- `AiStreamPart` in `quidproquo-core` now covers 23 variants (was 3: `text-delta`, `tool-call`, `tool-result`) and is discriminated by the new
  `AiStreamPartType` enum instead of raw string literals. Wire format (the `type` strings) is unchanged, but if you switch on `part.type` in TS,
  prefer `AiStreamPartType.TextDelta` etc. over string literals.
- Variants in `AiStreamPart` gained required fields: `AiStreamTextDelta` adds `id: string`; `AiStreamToolCall` adds `toolCallId: string`;
  `AiStreamToolResult` adds `toolCallId: string` and `input: unknown`. If you construct these parts yourself (rather than only consuming them from the
  stream), supply the new fields.
- `InfQpqWebserverServiceDomainsConstruct`, `ServiceDomainConstruct`, `QpqWebserverDomainConstruct`, and `getEnvironmentDomainName` are removed from
  `quidproquo-deploy-awscdk`. Service stacks no longer create their own hosted zones — declare the apex zone in your bootstrap stack and let services
  resolve it via SSM. If you used these constructs directly in custom stacks, delete the call sites.
- `StorageDriveQPQConfigSetting` and `KeyValueStoreQPQConfigSetting` in `quidproquo-core` now have a required `encryption: boolean` field. If you
  construct these settings directly (rather than via `defineStorageDrive` / `defineKeyValueStore`), add `encryption: false` to existing literals.
- `defineEnvironmentSettings` now takes a single `settingsByEnvironment: Record<string, QPQConfig>` map instead of `(environment, settings)`. Use
  `'*'` as a catch-all key for settings that apply to any environment. All call sites using the old two-arg form must be updated.
- `defineLogs(rootDomain, services, advancedSettings?)` is removed from `quidproquo-webserver`. Replace with
  `defineAdminSettings(logServiceName, rootDomain, advancedSettings?)` — the service list moves into `advancedSettings.services`.
- `defineExposeAdminAdvancedSettings(ownerModule, rootDomain)` is removed from `quidproquo-webserver`. Delete the call — every service that calls
  `defineAdminSettings` now gets these resources automatically.
- Lambda and Lambda@Edge functions deployed via `quidproquo-deploy-awscdk` now run on Node 22 (was Node 20). Verify your function code and
  dependencies are Node 22 compatible before redeploying.
- `resolveFilePath(config, serviceName, drive, filepath)` in `quidproquo-actionprocessor-node` is now
  `resolveFilePath(config, qpqConfig, drive, filepath)` — pass the full `QPQConfig` instead of a pre-resolved service name. Drives declared with
  `owner.module` are now read/written under the owner's folder; if you have existing local dev-server data for foreign-owned drives, move it from
  `<storagePath>/<callerService>/<drive>/` to `<storagePath>/<ownerModule>/<drive>/` before the next run.
- `QpqCoreKeyValueStoreConstruct.authorizeActionsForRole(role, kvsList)` in `quidproquo-deploy-awscdk` is now
  `authorizeActionsForRole(role, qpqConfig, ownedKvsList)`. If you build your own stacks with this construct, pass the `QPQConfig` as the second arg.
- Dev-server SQLite tables for key-value stores declared with `owner.module` are now stored under the owner's service prefix. If you have existing
  local data for foreign-owned KVSs, rename tables from `qpq_kvs_<callerService>_<name>` to `qpq_kvs_<ownerModule>_<name>`.
- `defineUserDirectory(name, options?)` in `quidproquo-core` now defaults `selfSignUpEnabled` to `false` (was effectively always `true` — the previous
  default couldn't be overridden due to a bug). If you rely on self-serve user signup, pass `selfSignUpEnabled: true` explicitly.
- `decodeJWT<T>(token)` in `quidproquo-webserver` is renamed to `unsafeDecodeJWTPayload<T>(token)`. Same arguments and behavior — it base64-decodes
  the payload without verifying the signature, so it must never be used for authorization. Update call sites.
- OAuth2 / federated-provider support is removed. `defineUserDirectory` no longer accepts `options.oAuth`, and the exported types
  `AuthDirectoryOAuth`, `AuthDirectoryFederatedProviderType`, `AuthDirectoryFacebookFederatedProvider`, `AuthDirectoryGoogleFederatedProvider`, and
  `AnyAuthDirectoryFederatedProvider` are removed from `quidproquo-core`. Deployed user pools no longer provision Facebook/Google identity providers.
  If you need federated login, configure the providers directly on the pool yourself.
- `exchangeOauth2TokenForAccessToken(code, authDomain)` is removed from `quidproquo-web` (and `quidproquo-web/auth` is no longer exported). If you
  were using it, implement the OAuth2 code-for-token exchange against your user pool's `/oauth2/token` endpoint in your client code.
- Lambda log groups deployed via `quidproquo-deploy-awscdk` now retain logs for 1 year instead of 1 week. Expect CloudWatch Logs storage costs to rise
  in proportion to your log volume on next deploy.
- Lambda functions deployed via `quidproquo-deploy-awscdk` now have X-Ray tracing set to `ACTIVE` by default (was `DISABLED`). X-Ray ingestion charges
  will apply on next deploy. To opt out, pass `disableTracing: true` to `defineAwsServiceAccountInfo`.
- API Gateway REST APIs deployed via `quidproquo-deploy-awscdk` now publish access logs to a new CloudWatch log group (1-year retention), enable
  CloudWatch metrics, and opt into the account-level CloudWatch Logs role (`cloudWatchRole: true`). Expect new CloudWatch ingestion/storage costs; if
  your account already has the API Gateway CloudWatch role configured, watch for a conflict on first deploy.
- `AiMessage` in `quidproquo-core` is now a role-discriminated union (`'user' | 'assistant' | 'tool'`) and `content` may be `string | AiMessagePart[]`
  instead of just `string`. Existing `{ role: 'user' \| 'assistant', content: 'string' }` literals continue to work, but exhaustive
  `switch (message.role)` blocks must add a `'tool'` case, and any code that assumed `content` is always a string needs to handle the array form. New
  part types `AiTextPart`, `AiFilePart`, `AiToolCallPart`, `AiReasoningPart`, `AiToolResultPart` are exported.
- `getDomainCertificateArnSsmParameterName(region)` in `quidproquo-config-aws` is now `getDomainCertificateArnSsmParameterName(region, rootDomain)`,
  and the param path changed from `/qpq/domain/certificate-arn/<region>` to `/qpq/domain/certificate-arn/<region>/<sanitized-rootDomain>`. Pass the
  same un-prefixed apex you pass to the matching `defineDomainCertificate`. Existing certs re-deploy to the new path; delete the old region-only
  params afterward.
- `lookupDomainCertificate(scope, certRegion, idSuffix)` in `quidproquo-deploy-awscdk` is now
  `lookupDomainCertificate(scope, certRegion, rootDomain, idSuffix)`. If you call it from custom stacks, pass the cert's root domain as the third arg.
- `QpqFunctionRuntimeAbsolutePath` (type) and `isQpqFunctionRuntimeAbsolutePath` (guard) in `quidproquo-core` are renamed to
  `QpqFunctionRuntimeAdvanced` and `isQpqFunctionRuntimeAdvanced`. Same shape and behavior — update any imports/usages.
- `quidproquo-actionprocessor-node` no longer re-exports the shared core/webserver processors (`getCustomActionActionProcessor`,
  `getDnsActionProcessor`, `getNetworkActionProcessor`, `getConfigGetGlobalActionProcessor`, etc.) — these now live in
  `quidproquo-actionprocessor-js`. Import them from `quidproquo-actionprocessor-js` instead. The composed `getCoreActionProcessor` /
  `getWebserverActionProcessor` exported from `-node` are unchanged.
- `askOverrideActions` override handlers in `quidproquo-core` no longer have their return value auto-wrapped for `returnErrors`. A handler that
  returns its own value must now shape it with `getSuccessfulEitherActionResultIfRequired(value, action.returnErrors)`; handlers that relay an action
  with `return yield action` need no change (and no longer double-wrap under `askCatch`).
- `enableMonthlyRollingBackups?: boolean` on `defineKeyValueStore` (and the required `enableMonthlyRollingBackups` on `KeyValueStoreQPQConfigSetting`)
  in `quidproquo-core` is replaced by `disablePointInTimeRecovery?: boolean`. DynamoDB point-in-time recovery (35-day continuous backups) is now **on
  by default**; set `disablePointInTimeRecovery: true` per table to opt out. Rename any `enableMonthlyRollingBackups: true` to dropping the field
  (PITR is already on); if you construct `KeyValueStoreQPQConfigSetting` directly, supply `disablePointInTimeRecovery: false`.
- The expense-extraction feature is removed. `askExtractExpense`, `ExtractActionType`, `ExtractExpenseErrorTypeEnum`, and the rest of
  `quidproquo-webserver/src/actions/extract` no longer exist. If you used them, implement AWS Textract expense analysis directly in your own action
  processor.
- Dev-server auth no longer synthesizes a single fake user for every login/lookup — logins now persist to
  `<runtimePath>/users/<serviceName>/<directoryName>.json` and userIds are scoped per user directory instead of just the email. Existing dev-server
  sessions/JWTs minted before this change will resolve to different userIds; log in again after upgrading.
- `askKeyValueStoreUpsert` conditional-write conflicts (`ifNotExists`) now raise `KeyValueStoreUpsertErrorTypeEnum.Conflict` instead of
  `ErrorTypeEnum.Conflict`. If you catch on the error type, switch to the namespaced enum value.
- `AiFilePart` in `quidproquo-core` is now a union of `AiFileUrlPart` (`{ type: 'file', url, mediaType, filename? }`) and `AiFileDrivePart`
  (`{ type: 'file', drive, filepath, mediaType, filename? }`). Existing `url`-based literals still work, but code that narrows only on
  `part.type === 'file'` and then reads `part.url` must also check `'url' in part` (or `'drive' in part`) to satisfy the new union.
- `toSdkMessages(messages)` in `quidproquo-actionprocessor-awslambda` is now `toSdkMessages(messages, resolveDriveFile)` and returns
  `Promise<ModelMessage[]>` instead of `ModelMessage[]`. Pass a `(drive, filepath) => Promise<QPQBinaryData>` resolver and `await` the call.
- `makeEventDocAiMessageFromText(role, text)` in `quidproquo-features` is removed. Use `makeEventDocAiUserMessage(text, attachments?)` instead — it
  always builds a `'user'` message; there is no replacement for building assistant-role messages from text.
- `chatMessagesToAiMessages(messages)` in `quidproquo-features` is now `chatMessagesToAiMessages(messages, docStorageDrive, docId)`. Pass the chat's
  storage drive name and doc id so file-attachment segments can be resolved to drive-referenced `AiFilePart`s.
- `defineAdminSettings(logServiceName, rootDomain, advancedSettings?)`, `defineAdminUserDirectory(options?)`, `adminUserDirectoryResourceName`, and
  the `QPQConfigAdvancedLogSettings` type have MOVED from `quidproquo-webserver` to `quidproquo-features` (the webserver exports are removed). Same
  signatures — update the import package. `defineAdminSettings` additionally provisions the admin session event-doc stores and `/v1/admin/session`
  routes that `quidproquo-web-admin` now requires at login (it creates a session doc and appends an audit event log to it), so redeploy the log
  service before shipping the new admin UI.
- `QpqExecutionTraceStep.locals` in `quidproquo-core` is now `Record<string, QpqExecutionTraceValue>` instead of `Record<string, string>`. Read
  `locals[name].preview` for the old display string; `locals[name].json` is a new optional deep-serialized value for expandable inspection.
- `qpq go:dev` now boots the API dev server and every views dev server together (was API only). Use the new `qpq go:dev:api` for the old API-only
  behavior.
- `askKeyValueStore*` actions now raise the action's own typed `StoreNotFound` member (e.g. `KeyValueStoreGetErrorTypeEnum.StoreNotFound`) when the
  store name is not declared in the qpq config. Previously this surfaced inconsistently: `ErrorTypeEnum.NotFound` from Get/Upsert/Query on AWS, a raw
  `'ResourceNotFound'` on the dev server, and a crash from Delete/Update. If you match on those old error types for a missing store, switch to the
  namespaced enum member.
- Tenant-aware storage scopes in `quidproquo-features` are now typed strings (`TENANT#<id>` / `PERSONAL#<userId>`) instead of a raw tenant id or
  `null`. `askActiveTenantRead`/`askActiveTenantReadOrThrow`/`activeTenantContext` now carry this typed value; use the new
  `askTenantReadActiveTenantId` wherever you need the bare tenant id rather than a partition.
- `askTenantResolveOptionalActiveTenant` is removed from `quidproquo-features`. Replace with `askTenantResolveRequestScope`, which always resolves to
  a typed scope (never `null`) and now throws `Unauthorized` for an unauthenticated caller instead of falling through unscoped.
- Tenant-scoped routes and collections (`askTenantProvideRequestScope`, `createTenantedRouteDefinition`, `askTenantScopeResolver`, the eventDoc
  `scopeResolver` hook) no longer run unscoped when no tenant header is sent — they now run under the caller's own `PERSONAL#<userId>` scope, and
  require an authenticated caller.
- `connectionScopeValidator` on `defineWebSocketQueue`/`defineTenantedWebSocketQueue` (`quidproquo-features`) is renamed to `connectionScopeResolver`
  and its contract changed: instead of an inline function returning `boolean`, it now runs on every Authenticate (claim or not) and must return the
  effective scope string to store (or throw to reject). `getWebSocketQueueGlobalConfigKeyForConnectionScopeValidator` is renamed to
  `getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver`.
- `TENANT_CONNECTION_SCOPE_VALIDATOR_FN` / `askTenantConnectionScopeValidator` in `quidproquo-features` are renamed to
  `TENANT_CONNECTION_SCOPE_RESOLVER_FN` / `askTenantConnectionScopeResolver`.
