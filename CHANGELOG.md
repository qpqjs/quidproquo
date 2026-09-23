# Changelog

## 0.1.27

- features: event-doc snapshots are filed under a per-collection `snapshotCacheKey`. Set it on `createEventDocDefinition` and change it whenever a version's seed or reducer changes in place (an additive change with no schema bump): snapshots written under any other key are invisible, so every reader refolds the log from scratch and the projector files a fresh snapshot under the new key on the next append. The bootstrap base carries the key so a workspace snapshot held in the browser across a deploy is refetched rather than trusted. `askEventDocReprojectHead` re-runs the projector at a document's head, the primitive for an admin reseed job after a key change. Omitting the key keeps the legacy row layout, so existing collections are unaffected

## 0.1.26

- webserver/deploy-awscdk/actionprocessor-awslambda/dev-server: inbound email. `defineEmailReceiver` declares a receiving address and runs an `onEmail` function once per message with a parsed `EmailMessage`, instead of handing you a raw object in a drive to parse yourself. It owns its own storage drive, the SES receipt rule lives in the api stack next to the handler, and the receiver has to be declared in the service that handles the mail (a bootstrap-only `defineEmailReceivingDomain` is no longer enough)
- features: tenant roles replace the fixed owner/member pair. `defineTenant` takes a role catalog and the roles a tenant's creator is seeded with, memberships carry `roles` plus direct permission grants, and there are routes for assigning them (a member can always remove themselves). Tenanted event-doc routes are permission-gated per collection and action, with an authorise hook for custom checks, and there is a membership UI state module for the frontend
- core: `defineStorageDrive` and `defineKeyValueStore` gain a `scoped` option that is enforced at call time. A scoped resource refuses an unscoped read or write and vice versa with `InvalidScopeError`, so a missing scope fails loudly instead of quietly touching the unpartitioned rows. `StorageDriveEvent` carries the scope when the drive is scoped
- core/config-aws/deploy-awscdk: drives and stores pick their encryption key by name with `cryptoKeyName` pointing at a `defineCryptoKey`, rather than a raw KMS arn. Everything stays encrypted with the provider's managed key when it is omitted, and synth fails if a named key cannot be resolved. Signing and crypto keys that would collide on name are caught at synth
- features: a tenant's own document now lives under its `TENANT#<id>` scope, so a tenant is edited from inside itself rather than by whoever happened to create it. Tenant ids are a branded `TenantId` (built on a new core `Brand` type and `createBrandGuard`), so a bare string no longer type-checks where a tenant id is expected
- features: `EventDocBackend` document reads are typed from the definition's view instead of returning a loose shape
- features: event-doc append retries go to 20 with a wider redelivery cushion, so a slot race under contention resolves instead of failing the append
- dev-server: a user store entry missing on a restart is reseeded from the access token, so a logged-in session keeps working

### Breaking changes

- `defineEmailReceiver` returns a config fragment, owns its drive, and requires an `onEmail` function; `storageDriveName`/`keyPrefix` are gone
- `QpqWebserverEmailReceiverConstruct` is renamed `QpqApiWebserverEmailReceiverConstruct` and moves to the Api stack, accepting only a drive the service owns
- `defineStorageDrive`/`defineKeyValueStore` `scoped` is enforced: mismatched scope now throws `InvalidScopeError`, and `scoped` with `copyPath` throws at config time
- the `encryption: boolean` option is replaced by `cryptoKeyName`; `defineAwsKmsKey` and the `getAwsKmsKey*` helpers are removed
- `TenantMembershipRole` is removed: memberships carry `roles: string[]` plus `grants`, `askTenantLinkMember` takes an array, and `askTenantRolesConfigRead` returns `{ catalog, creatorRoles }`
- tenanted event-doc routes require an `eventDoc:<storeName>:<action>` permission, and a route with a `permission` refuses personal-scope callers unless `allowPersonalScope` is set
- tenant docs move to their own `TENANT#<id>` scope and `TenantRecord.scope` is removed; tenants created before this need migrating
- tenant ids are the branded `TenantId`; brand request-supplied ids with `askTenantIdParse`, stored ones with `toTenantId`
- `TenantCallerMembership` gains a required `effectiveGrants` field

## 0.1.25

- features/core/actionprocessor-awslambda: resumable AI turns. An event-doc AI chat turn now budgets against the execution deadline: `askEventDocAiStreamTurn` reads the remaining runtime, gives the model the rest as `maxDurationMs`, and when the time budget or the output token cap cuts the reply short it saves what it has and hands the turn to a continuation service function (registered by `defineEventDocAi`), returning `SERVICE_REQUEST_DEFERRED` so the finished reply arrives on the same websocket correlation from the next execution. `askAiPrompt` and `askAiPromptStream` gain `maxDurationMs` and `maxOutputTokens` options, and `defineEventDocAi` takes `maxOutputTokens` (default 65536, since the Bedrock default of 8192 cuts a reasoning block plus a large tool input off mid-JSON). The in-flight reply in `EventDocAiState` is folded into `streamSegments` as each chunk lands instead of re-merging the whole part list every time
- core/actionprocessor-awslambda/actionprocessor-js: `askGetRuntimeRemainingTime` returns the milliseconds left before the platform kills the current execution (lambda's `getRemainingTimeInMillis`; runtimes with no limit return `Number.MAX_SAFE_INTEGER`), so long loops can stop cleanly and hand off
- features: admin log bodies are redacted before any download, trace, or AI tool read. The first read of a correlation writes a redacted copy to the log reports drive and every admin-facing path reads that copy. Redaction covers known secret keys, JWTs, encrypt inputs, secret lookup results, and the same values nested inside base64, form-urlencoded, and JSON-string encoded request bodies
- core/deploy-awscdk: `defineStorageDrive` gains a `lockedDown` option that denies object reads at the bucket to every principal except the owning service's runtime role (listing and bucket management stay open, and a presigned url only works when the service role signed it). The raw logs drive is locked down, so every service writes and admins only ever read the redacted copies
- features: an event-doc append whose event the fold cannot read is refused instead of stored. `askEventDocValidateAppend` folds the candidate against the registered `foldDocumentState`, and `withEventDocSchemaVersionCeiling` rejects a schema version above the collection's latest, so an unreadable event can no longer land permanently in the append-only log and break every later read

### Breaking changes

- `EventDocAiState.streamParts` is replaced by pre-folded `streamSegments` plus `isStreaming`; read the segments instead of merging parts
- `EventDocFunctions.validateEvent` is now required and `askEventDocValidateAppend` returns the folded state instead of `void`; pass `() => null` for a collection with no rules

## 0.1.24

- core/actionprocessor-awslambda/dev-server/deploy-awscdk: signing keys. `defineSigningKey` declares an RSA-2048 key pair whose private half never leaves the provider (a KMS sign/verify key on AWS, a locally generated pair under `.qpq-runtime` on the dev server). Stories sign and verify through `askCryptoSign`, `askCryptoVerify` and `askCryptoGetPublicKey`, or at the JWT level through `askCryptoSignJwt` and `askCryptoVerifyJwt`, RS256 throughout. Only the owning module's role is granted `kms:Sign`; verification runs in-process against a cached public key so the per-request path makes no KMS call. Replaces loading a PEM private key from a secret, which left the key in the lambda and in every story log that read it
- core/actionprocessor-awslambda/actionprocessor-node: `askFileCopy` copies an object to another path, on the same or another drive, without the bytes crossing the story (an S3 server-side `CopyObject` on lambda, `fs.copyFile` plus the metadata sidecar locally); one scope applies to both sides. features: `EventDocBackend.askCopyAssetFrom` copies another collection's asset onto one of this collection's documents as a new immutable asset, optionally under a new filename
- webserver/actionprocessor-awslambda/dev-server: route matching tries the most specific path first. Routes were sorted by static length ascending, so a parameterised sibling (`/packs/{id}`) always won over a literal one (`/packs/build`); the sort is now descending and the dev server uses the same helper instead of its own raw-length sort, so local and deployed matching agree
- deploy-awscdk: the read-only Cognito grant a service gets on another service's user directory is now scoped by the owner's identity tags (application, module, environment, feature) on any pool in the account instead of importing the owner's pool id export, so inf stacks no longer take a synth-time dependency on each other
- features: `EventDocEventValidators` is keyed by the doc's effect types, so a rule's `event.payload.data` is typed to that effect and a validator keyed on an unknown effect fails to compile; the `'*'` fallback still works
- features: the event-doc summary projector deletes a document's summary row when a stream Remove leaves its log empty, instead of writing the `NO_INIT` seed; emptying an events table (`qpq clear-resources`, a transfer that removes a doc) no longer repopulates the summary table with placeholder documents
- dev-server: seeding a signing key pair is safe under concurrent first use, and json store writes are atomic

### Breaking changes

- `EventDocEventValidators` is typed against the doc's effects union instead of `Record<string, EventDocEventValidator>`; `EventDocEventValidator` gains a `TData` generic
- a signing key declared with a foreign `owner` can no longer sign: `kms:Sign` goes only to the owning service and the dev server returns `KeyUnavailable`; move the sign call into the owning service

## 0.1.23

- actionprocessor-awslambda/deploy-awscdk: a key value store query that names the primary sort key alone (a `userId`/`tenantId` table with a GSI on `tenantId`) is routed to that GSI again instead of the primary table, where it failed; queries naming the primary partition key still prefer the table. A service that only references another service's user directory now gets read-only Cognito access to it (`ListUsers`, `AdminGetUser`) on its webserver role, so user lookups by email or id work from a service that does not own the pool
- features: tenant branding gains `displayName`, the text shown beside the logo in the app header. Omit it to leave the current value alone, pass an empty string to clear it for a logo-only header

## 0.1.22

- features: tenant member management. The membership-gated tenant routes gain `GET`/`POST` on `/{id}/members` and `PATCH`/`DELETE` on `/{id}/members/{userId}`, backed by `askTenantMemberList`, `askTenantMemberAdd`, `askTenantMemberUpdate` (role changes) and `askTenantMemberRemove`, owner-gated. Membership is stored as one `TenantMembership` row per user/tenant pair, with a tenant-keyed index serving the member list, instead of two link tables that had to be kept in step

### Breaking changes

- tenant membership link stores and their `ask*Links*` helpers are replaced by one `TenantMembership` store and the `askTenantMembership*` helpers; deployed tenant data needs a migration

## 0.1.21

- deploy-awscdk: every lambda in a stack now shares one `QpqServiceRole` construct, and grants made against it (event sources, tracing, `addToPrincipalPolicy`) are packaged into customer-managed policies chunked under the IAM document size limit instead of piling onto the role's inline policies, so a service with many queues, streams and buses no longer hits the 10kb inline-policy cap at deploy. The SES email sender construct is keyed by the primary root domain rather than the setting, so changing the setting no longer tries to recreate an identity the stack already owns
- actionprocessor-node: story tracing passes an explicit script end to `Debugger.getPossibleBreakpoints`, so a story loaded a while before the trace still gets breakpoints instead of an empty list once V8 has flushed its bytecode

## 0.1.20

- webserver/deploy-awscdk: domains are redone around a root list and an app-owned resolver. `defineDns` takes one or more root domains plus a `QpqPureFunction` pointer to a `DomainResolver` that decides every hostname; the tooling requires it at synth and the runtime loads it on demand. Every domain-bearing construct (api, websocket, cdn, redirects, email) now deploys on every root, one certificate per region covers all of them, and `rootDomain` disappears from the define helpers
- webserver/features: openapi document generation. A dynamic route can declare zod `schema.body`/`schema.query` and its handler receives the validated `input`; `askOpenApiGetDocument` builds the document from the route config, `defineOpenApiRoutes` mounts it alongside a reference page, and each server url is mounted under the service module name. The old `defineOpenApi` spec setting is gone
- features: event-doc ids are contiguous numbers again. Appends claim a run of consecutive slots with a conditional batch write, lose cleanly to a concurrent writer, and re-fold the gap before retrying; `askEventDocValidateAppend` takes the folded state instead of resolving it. Smoke tests cover concurrent and interleaved batch appends
- core/actionprocessor-awslambda/dev-server: `askKeyValueStoreUpsertMany` gains `ifNotExists`, an all-or-nothing batch insert that runs as a DynamoDB transaction on lambda and a sqlite transaction locally. Upsert error mapping now separates `WriteContention` (a transient race against an in-flight transaction, safe to retry) from `Conflict` (the item exists), and `askKeyValueStoreUpsertWithRetry` re-laps on contention
- config-aws/deploy-awscdk/cli: GitHub Actions can deploy over OIDC. `defineAccountGithubOidcProvider` (account stack) and `defineAwsGithubDeployRole` (bootstrap) create a role trusted only for the repo's immutable ids with deploy-scoped permissions instead of admin. The new `qpq setup` command walks a fresh account through identity, cdk bootstrap, hosted zones, buckets, the oidc provider and the deploy role, checking each step
- deploy-awscdk: the api gateway service-linked role is created before any custom domain, so a fresh account's first custom-domain deploy no longer fails with "Access denied to certificate"
- dev-server: json and form bodies reach service routes as the raw string, exactly as API Gateway delivers them, so a route parses and rejects its own body on the production code path; configs are localised once for every plugin, so a story in a queue or schedule worker derives urls on the dev origin rather than the deployed domain
- cli: `--keep-other-dev-servers` on dev start skips the pre-start port sweep
- features: admin log metadata falls back to the session from `GetStorySession`, so stories that never set an access token still record who ran them
- qpqjs reference app (the create-qpq-app template): smoke tests run in parallel via one queue message per test, and the deployed smoke script runs its edge checks against every root domain

### Breaking changes

- `defineDns` takes `rootDomains` plus a resolver pointer; `rootDomain` is removed from `defineApi`, `defineWebsocket`, `defineEmailSender`, the web/proxy domain options, `defineUserDirectory`'s `dnsRecord` and the features wrappers
- `getDomainName`, `getDomainRoot`, `getServiceDomainName` and the other old domain helpers, plus `askGetDomainRoot`, are removed; use `getRootDomains`, `resolveHosts`, `resolvePrimaryHost` and `askDnsResolveHosts`
- `defineDomainCertificate` is now `(region, targets, options?)`, one certificate per region under an app-keyed SSM parameter; old per-root cert stacks are orphans to delete by hand
- `defineEmailSenderAllowList` takes only the address list; `getEmailSenderAllowedAddresses` drops its domain argument
- `defineSubdomainRedirect`'s `addEnvironment`/`addFeatureEnvironment` no longer prefix the target; a bare root redirects to the resolver's site root
- `deploy.config.json` and `QpqAppDeployContext` lose `domain`; roots live only in `defineDns`
- `SubdomainName` (deploy-awscdk) takes `{ target, rootDomain }`; domain constructs now create resources on every root, extra roots with `-<root>` suffixed ids
- `askKeyValueStoreUpsert`/`askKeyValueStoreUpsertMany` throw the new `WriteContention` for a lost transaction race instead of `Conflict`; catch both
- `defineOpenApi`, `askGetOpenApiSpec`, `OpenApiSpecActionType` and `getAllOpenApiSpecs` are removed
- `dynamicRoute`, `createRouteDefinition` and `createTenantedRouteDefinition` take a `DynamicRouteConfig` (`{ knownErrors, schema? }`) instead of a bare known-errors map
- `EventDocEventMetadata.eventId` is a `number` again instead of a sortable-guid string
- `askEventDocValidateAppend` takes `(event, state)` instead of `(modelId, event)`
- `defineAwsGithubDeployRole` no longer trusts the name-form OIDC subject by default (opt in with `trustNameForm`) and the role drops from AdministratorAccess to deploy-only permissions

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
