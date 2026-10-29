# QPQ code standards

How code in the quidproquo framework and in applications built on it is written and laid out. Each rule has an id (G1, A3, ...) so reviews and commits can cite it. Rules marked **lint** are checked mechanically; the rest are review rules.

The cleanup backlog that brings existing code in line lives outside the repo (`qpqjs-files/future_work/code-standards-todo.md`). This document describes the target, not the history.

Contents: [General](#general) · [Actions and requesters](#actions-and-requesters) · [Action processors](#action-processors) · [Stories and logic](#stories-and-logic) · [Config settings and deploy](#config-settings-and-deploy) · [Frontend and state modules](#frontend-and-state-modules) · [Application standards](#application-standards) · [Tests](#tests) · [Lint, tooling and packages](#lint-tooling-and-packages)

---

## General

**G1. One export per file, file named after it.** Two exports are allowed only when they are one concept: an effect and its payload type, or an `askXBase` requester and its short generic wrapper. A state type is type-only in `types/`; its `createInitial<Module>State` is its own file in `logic/`. **lint**

```
stateUpdaters/setLoading.ts     export const setLoading = ...
stateUpdaters/setError.ts       export const setError = ...
types/TenantState.ts            export type TenantState = ...
logic/createInitialTenantState.ts
```

**G2. Shared code goes to the shared home from the start.** A helper that looks reusable is written in the lowest shared package (core, `@qpqjs/features`, the app's `service-utils`, the design service) even while it has one user. A second copy of anything is a bug, not a convenience.

**G3. A story does one kind of work.** Validate, orchestrate, do I/O, or format. There is no line limit; a reviewer may ask for a split on responsibility grounds.

```ts
function* askEnvelopeCreate(input) {
  yield* askEnvelopeValidateInput(input);
  const id = yield* askEnvelopePersist(input);
  yield* askEnvelopeNotifyCreated(id);
  return toEnvelopeView(id, input);
}
```

**G4. No non-trivial logic inline as a call argument.** An inline callback may not contain error handling, a loop, or a branch beyond a single guard. Anything more is a named top-level function passed by name. A one-expression inline generator is fine.

```ts
// fine
const ids = yield* askMapParallel(items, function* (item) { return yield* askEnvelopeIdByCode(item.code); });

// named
function* askSendOrNull(item) {
  const result = yield* askCatch(askSend(item));
  if (!result.success) {
    yield* askLogCreate(LogLevelEnum.Warn, result.error.errorText);
    return null;
  }
  return result.result;
}
yield* askMapParallel(items, askSendOrNull);
```

**G5. `type` over `interface`, `unknown` over `any`, `Nullable<T>` over `| null` or `| undefined`.** `interface` only for `extends` or declaration merging. `any` needs an adjacent comment saying why. **lint** (type definitions; `| null` as a warning)

**G6. Barrels.** Every directory has an `index.ts` that only re-exports. Inside a module, import leaf files (`../actionCreators/askTenantSetLoading`), never the module's own barrel. When something moves, repoint every caller; never leave a forwarding `export { X } from '<old>'` behind. **lint** (export-from outside `index.ts`)

**G7. Comments.** Every export gets a one-to-three-line JSDoc: what it is for and any contract the signature does not express. Inline comments only for what the code cannot say (a workaround, an invariant). Never narrate history ("used to", "moved from"), never restate the code, never use an em dash. **lint** (em dashes, history words; JSDoc as a warning)

**G8. Constants.** One per file, SCREAMING export, camelCase file name, under `constants/`. Resource names, ports, paths, store names and limits are never written inline at a call site.

```ts
// constants/signDevPort.ts
export const SIGN_DEV_PORT = 3074;
```

**G9. Generics are `<TResult, TPayload>`**, and the payload type is inferred from the argument wherever possible so callers write only the result type: `askApiRequest<User>('/users', { id })`.

**G10. Options object over positional arguments** once a function has more than four parameters.

**G11. No dead code.** No commented-out blocks, no placeholder exports (an unused package is exactly `export {};`), no exports only their own file uses, no tracked scratch files. A TODO names its owner by GitHub handle: `// TODO: @joe-coady: refactor this to be faster`.

---

## Actions and requesters

**A1. Domain folder layout.** `actions/<domain>/` holds `<Domain>ActionType.ts` (the enum and nothing else), one `ask<Domain><Verb>.ts` per action with its test beside it, shared types under `types/` (one per file), helpers under `utils/`, composed logic under `stories/`, and an `index.ts`. Action definitions never live outside `actions/`; processors never live inside it.

```
actions/userDirectory/
  UserDirectoryActionType.ts
  askUserDirectoryCreateUser.ts
  askUserDirectoryCreateUser.test.ts
  types/UserAttributes.ts
  stories/askUserDirectoryEnsureUser.ts
  utils/
  index.ts
```

**A2. Action ids.** `@quidproquo-<pkg>/<PascalDomain>/<PascalVerb>`; the enum member equals the last segment.

```ts
export enum QueueActionType {
  SendMessages = '@quidproquo-core/Queue/SendMessages',
}
```

**A3. Requester names are `ask<Domain><Verb>`**, noun first, no abbreviations: `askGuidNew`, `askPlatformDelay`, `askErrorThrow`, `askEventDocApplyEvent`.

**A4. Type names.** `<Domain><Verb>ActionPayload`, `<Domain><Verb>Result`, `<Domain><Verb>Options`. `getPayload` annotates its return with the payload type. Enum members are PascalCase.

**A5. Error catalogs.** Every action that can fail declares `errorTypes`, one commented entry per line. A failure with a standard meaning uses the standard name (`NotFound`, `Conflict`, `Forbidden`, `Invalid`, `Throttled`, `Timeout`); action-specific failures are free-form entries beside them. The comment describes the failure in platform-neutral terms. A generic wrapper re-attaches `errorType` from its base. There are no standalone `XxxErrorTypeEnum`s.

```ts
errorTypes: [
  'NotFound',     // no render with that id
  'Throttled',    // the model provider rate-limited us
  'RenderFailed', // the renderer crashed mid-document
],
```

**A6. A requester file holds the factory call.** The base action is the bare `createActionRequester` call; a one-or-two-line augmentation (a generic cast wrapper, a default) may share its file. Anything that branches, loops or composes is a story in `actions/<domain>/stories/`. Payload-less actions omit `getPayload`; each default is declared once, in `getPayload`.

**A7. Typing forms.** `AskResponse` is the only generator type. Processors are typed with `ProcessorFor<typeof askX>` and built with `createActionProcessor`; actions with `ActionOf<typeof askX>`. No hand-written `XxxAction` interfaces, no hand-keyed `[XActionType.Y]: ...` maps.

**A8. Context identifiers.** Folder `context/`, one file per export, each built from a core factory: `<thing>Context.ts` (`createContextIdentifier`, or `createLocalContextIdentifier` for a value that must never cross a service boundary; uniqueName `qpq-<kebab>`), `ask<Thing>Read.ts` (`createContextReader`), `ask<Thing>Provide.ts` (`createContextProvider`), and optionally `ask<Thing>ReadOrThrow.ts` (`createContextReaderOrThrow(ctx, errorType, message)`, default `NotFound`). Context values must be serialisable; capabilities are injected as parameters, never put on a context.

**A9. `types/` is type-only.** Runtime code (factories, helpers) lives under `logic/` or `utils/`. `models/` holds serialisable data shapes.

---

## Action processors

**B1. One processor per file.** `export const get<Domain><Action>ActionProcessor = createActionProcessor(askX[Base], getProcess<Domain><Action>)`. The file name equals the export and the file exports nothing else. Empty results are `actionResult(undefined)`. **lint** (unused imports)

```ts
const getProcessQueueSendMessages = (qpqConfig: QPQConfig): ProcessorFor<typeof askQueueSendMessagesBase> =>
  async (payload) => { ... };

export const getQueueSendMessagesActionProcessor = createActionProcessor(askQueueSendMessagesBase, getProcessQueueSendMessages);
```

**B2. Aggregation.** A domain's composer is its own file `get<Domain>ActionProcessor.ts` (an `ActionProcessorListResolver`), re-exported by the domain `index.ts`. The plural `get<Package>ActionProcessors` is reserved for the package root. Event-handler folders are `event/<source>/<trigger>/` with no "Event" in the folder names, and their composers are `get<Source><Trigger>EventProcessor` (`getS3FileEventProcessor`, `getSqsQueueEventProcessor`). Plugin packages register their processors from inside their own `define*` helper via `defineActionProcessors`. The order in which processor layers merge (platform, runtime, handler, custom last) is fixed by one shared composer function, not by convention.

**B3. Errors.** All I/O inside the `try`; `catch (error: unknown)`; `actionResultErrorFromCaughtError` with a name-keyed map to the action's catalog. No `instanceof`, no empty `{}` maps. Every runtime returns the same catalog entry for the same failure: the dev-server returns what AWS returns. A deliberate swallow (a failed lookup treated as "no match") gets a one-line comment.

```ts
try {
  const endpoint = await getExportedValue(...);
  await client.send(command);
  return actionResult(undefined);
} catch (error: unknown) {
  return actionResultErrorFromCaughtError(error, {
    GoneException: () => actionResultError(askWebsocketSendMessage.errorType.Disconnected, 'Connection gone'),
  });
}
```

**B4. Config lookups.** Processors use the setting's accessors (`get<X>ByName(name, cfg)` returning `Nullable`, or `resolve<X>OrThrow(name, cfg)`), never `.find` on a config list. `process.env` is read only in a lambda-entry helper and passed down, never at module load in a processor file.

**B5. Package layout.** One root, `src/actionProcessor/<area>/<domain>/`. Helpers in `<domain>/utils/` with an index, never loose beside processors. Runtime-specific replacements use a `<domain>Override/` folder. Every processor has a sibling `.test.ts`.

**B6. Identical processors live once.** A processor whose body is the same across event sources or runtimes lives in the shared package and is spread into each composer.

**B7. Clock and ids.** Processors and nested runtimes use core's `getDateNow` and `generateUuid` (plus one helper for sortable ids). No inline `new Date()`, no `node:crypto` for ids. **lint** (inside generators)

**B8. Processors that run stories** use `getProcessCustomImplementation` or `createNestedRuntime` with the shared clock and id helpers, null-check the loaded module, and convert back with `storyResultToActionResult` so the error stack and label survive.

**B9. No `console.*`** outside the Log and Metric processors, logger implementations and the CLI. **lint**

**B10. Factories never throw and do no I/O.** Pure config (and SDK client construction) happens once in the factory; I/O happens per call; bad config is reported per call as a typed error, so one misconfigured action cannot stop the whole runtime from starting.

---

## Stories and logic

**C1. Every generator is `ask<Domain><Verb>`**, noun first. Entry handlers (route controllers, queue and event handlers, inline functions) are the one exception: they are named after their trigger. A generator that never yields may stay a generator; it is an extension point. **lint** (`ask` prefix reserved for generators, with the entry-folder exemption)

**C2. Stories are deterministic.** No clock, randomness or `process.env` inside a story or anything it calls; use `askDateNow` and `askNewGuid`. **lint**

**C3. Throw with `return yield* askErrorThrow(...)`.** Never a bare `yield*`, never `throw new`, never a `!` or `as` to satisfy the checker after a throw. **lint**

**C4. Shape.** One exported generator per file, named after it. Options object over four parameters. Batch sizes and timeouts are named constants. Inline callbacks follow G4.

**C5. Error handling and mutations.** Stories never use `try`/`catch`; failures are caught with `askCatch`, which returns `{ success, result | error }` and takes an optional finally story. A `Set*(true)` flag is cleared only through that finally parameter. An ordinary UI mutation is optimistic: dispatch the change, call the backend, and on failure restore the UI (reverse effect or refetch) and set the error. The "clear error, catch, set error" sequence is one shared helper. Event-doc edits are different by design (apply event, fold, save) and are not covered by this rule.

```ts
yield* askUISetSaving(slot, true);
const result = yield* askCatch(askSavePending(pending), askUISetSaving(slot, false));
if (!result.success) {
  yield* askUISetError(slot, result.error);
}
```

**C6. Config and context.** Logic may read globals and config. A value needed by many stories is resolved once at the entry and provided on a local context. Logic reads context (scope, store) and passes it into data as parameters; data never reads context itself. The event-doc store follows exactly this shape.

**C7. Layering.** `entry` calls `logic` calls `data`, never skipped and never reversed. `logic/` and `data/` hold one story per file.

**C8. Paging.** Draining all pages uses `askKeyValueStoreQueryAll` or the shared drain helper. A hand-written page loop is allowed only when it must stop early.

---

## Config settings and deploy

**D1. One folder per setting.**

```
config/settings/queue/
  types/QueueQPQConfigSetting.ts
  types/QPQConfigAdvancedQueueSettings.ts
  types/index.ts
  logic/isQueueSetting.ts
  logic/getAllQueueConfigs.ts
  logic/getOwnedQueueConfigs.ts
  logic/getQueueByName.ts
  logic/resolveQueueOrThrow.ts
  logic/index.ts
  defineQueue.ts
  defineQueue.test.ts
  index.ts
```

The options type is always `QPQConfigAdvanced<Name>Settings` extending `QPQConfigAdvancedSettings`. Defaults use `??`. A define never ignores its `options`. A composite define returns `QPQConfig`. `is<Name>Setting` is the only way to narrow a setting; `configSettingType === X` followed by a cast is banned elsewhere. **lint**

**D2. Setting-type enums.** PascalCase keys, values `@quidproquo-<pkg>/config/<PascalName>`, one enum per package including features.

**D3. Platform concerns live in the owning layer.** No Lambda, CloudFront or API Gateway value on a core or webserver setting; a config-aws setting keyed by the core resource name carries it, resolved at deploy.

**D4. Names are derived.** No `xName?: string` override fields on settings. Cross-module owners always pass through the owner normaliser. A setting that must be unique per service is enforced by one helper.

**D4a. `define*` is config only.** A `define*` helper returns `QPQConfigSetting`s or a `QPQConfig`; helpers that instantiate live objects (reducers, apis, CDK constructs) are `create*` or `build*`. `define*` results are never spread into a config (`...defineX()`); QPQ flattens nested arrays itself. **lint**

**D5. Accessors.** Per setting type: `getAll<X>Configs(cfg)`, `getOwned<X>Configs(cfg)`, `get<X>ByName(name, cfg): Nullable`, `resolve<X>OrThrow(name, cfg)`. Name first, config last. They live in the setting folder's `logic/` and are re-exported by the package's utils namespace. No inline `getConfigSettings` elsewhere.

**D6. Naming lives in config-aws.** One naming module plus one `resolveOwnedResourceName(name, cfg, owner)` applying the owner's override, module, application, environment and feature. Every physical name, ARN and SSM key goes through it, at deploy time and at runtime, so grants and lookups cannot disagree. Template literals combining app, environment or feature are banned outside it. **lint**

**D7. Registry, layered.** A setting type is never wired into a hand-maintained list. Core's setting folder owns what core knows (the guard, bundle entries); each consumer package registers its own part keyed by setting type: deploy-aws `{ phase, build, authorize }`, dev-server `{ plugin }`, cli `{ clearable }`. Stacks, `getAllSrcEntries`, `flattenQpqConfig`, dev-server plugins and CLI clear-resources iterate those registries. A package with no part for a type registers nothing.

**D8. Construct contract.** Every resource construct extends `QpqConstructBlock`, is named `Qpq<Phase><Layer><Thing>Construct`, and has one `static fromOtherStack(scope, id, cfg, setting)` and one `static authorize(scope, role, cfg)`. Cross-stack values travel by SSM parameter only. Lambdas are built only through `Function`, which applies the shared VPC, layer and environment helpers. Removal policy, log retention and tags come from the shared settings on every resource. No account-wide IAM wildcards.

**D9. CLI.** Commands get `{ appName, deployment, driver }` from one `resolveCommandContext`. Environment variable names come from the `QpqDeployEnvVar` enum. Paths come from `getServiceDistPath` and friends; names from the naming module. All spawning goes through `runCommand`. Output goes through one helper with a `[qpq:<area>]` prefix. Library code throws `CliError`; only the command layer maps it to an exit code.

**D10. Dev-server parity.** Every setting field that changes deployed behaviour (retries, concurrency, ordering, auth checks) is honoured locally. A queue retries up to `maxTries`; the dead-letter step is skipped only because there is no local DLQ. Services that cannot run locally (Bedrock, Neptune) call real AWS.

---

## Frontend and state modules

**E1. Module layout.** One concern per folder, in both the framework and applications:

| Folder | Holds |
|---|---|
| `types/` | Type-only files: `<Module>State.ts`, tab unions, status enums, one per file |
| `models/` | Serialisable domain shapes shared across layers |
| `effects/` | `<Module>Effect.ts` (the enum), one `<Module><Verb>Effect.ts` per effect (payload type + effect type), `<Module>Effects.ts` (the union only) |
| `actionCreators/` | One `ask<Module><Verb>` per file, dispatch only |
| `stateUpdaters/` | One pure `(state, payload) => state` per file, wired by `buildEffectReducer` |
| `logic/` | One story or pure helper per file, including `createInitial<Module>State` |
| `selectors/` | One `select<Module><Thing>` per file; parameterised factories are `create<Thing>Selector` |
| `transport/` | The stories that talk to the backend |
| `forms/` | Zod schema plus form definition |
| `constants/` | One named constant per file |

The api surface file (`shared<Module>Api.ts` in shared logic, `frontend<Module>Api.ts` in views) only composes imports; verbs are never declared inside it. Design-system components use `types/<X>Props.ts` and `styles/<x>Recipe.ts`; their barrels only re-export.

Event-doc modules use the same shape. An event-doc event is an effect: the enum and per-effect files live in `effects/`, creators dispatch with `askApplyEventDocEvent<TheEffect>(enum.member, data)`, the fold reducer consumes `EventDocFoldEffects<TheEffectsUnion>` with its handlers in `stateUpdaters/`, and logic stories call the creators rather than `askApplyEventDocEvent` directly. The workspace chrome slot in `@qpqjs/features` is the reference example.

**E2. Effects.** UI effect enum values are `'<ModuleName>/<Verb>'`; persisted event-doc events are unprefixed `VERB_NOUN`. UI payloads are `<Module><Verb>Payload`; event-doc payloads are `<Doc><Verb>Data`.

**E3. Creators.** A creator is `ask<Module><Verb>` and lives in `actionCreators/`; that folder is what marks it as dispatch-only. A logic story that wraps a creator lives in `logic/` and takes a different verb (`askTemplateSetHtml` creator, `askTemplateReplaceHtml` story). No `UI` or `Apply` infixes.

**E4. Selectors over readers.** Experience readers are `select<Module><Thing>` in `selectors/`, not `get<X>LiveDocument` helpers in `logic/`.

**E5. No `useEffect` for data.** Initial loads run in a runtime or editor-module `onInit` story. Key-change loads are dispatched by the story that changed the key. `useEffect` is allowed only for subscriptions to external systems (DOM, websocket, timer, an editor instance) and only inside a `hooks/` file. Never disable `react-hooks/exhaustive-deps`. **lint** (hooks in `.tsx` outside `hooks/`)

**E6. Components.** `export const X = (props: XProps) =>`, named export, `type` props in `types/XProps.ts`, one component per `X/X.tsx` folder with an `index.ts`. State is read with `useComputed(state, selectX)`, never raw `state.x` in JSX. Only the module root calls the runtime hook; children receive `api` and `state` as props. Components never fetch. Prefer one composite `use<Component>Controls` hook over many single-effect hooks.

**E7. Styling.** Application views import visual primitives only from the design service; raw Chakra is limited to `Box`, `Flex` and `Grid` with layout props; no service-owned recipes; `style={{}}` only for computed geometry.

**E8. Views entry files.** A views package whose modules are only loaded through the shell contains just `modules/` and `components/`; the bundler supplies a default entry. Only a service with a real standalone app keeps its own `main`, `bootstrap`, `app` and `index.html`. Module files are `.ts`.

**E9. Share, don't reach across.** A component, hook, constant or selector needed by a second module moves to the design service, the shared editor module, or the framework. Sibling modules never import each other.

**E10. Hook api types.** A hook that takes a slice of the module api types it as `Pick<ModuleApi, ...>`; it never redeclares the function shapes. Its own return and other argument types are its own.

---

## Application standards

How a QPQ application is expected to be laid out. `<app>` is the application name and `<service>` one of its services; package names are `@<app>/<service>-<kind>`.

**P1. Service skeleton.** Every service has all eight packages. An unused one contains exactly `export {};`.

```
apps/<app>/services/<service>/
  config/          identifiers the service's infrastructure and runtime share (store names, queue names, base paths, ports); frontend-safe
  models/          the service's domain models, one per file; imports no other service; what other services import
  x-models/        this service's composition types over other services' models; importable only inside this service
  x-logic/         the service's public verbs (typed fetchers, pure helpers, browser-safe requesters)
  shared-logic/    state modules shared by this service's frontend and backend (E1 layout)
  service-utils/   backend-only public surface (service-function wrappers, authenticators)
  service/         the backend
  views/           the federated frontend
```

The backend lives only under `service/src/`: `infrastructure.ts`, `entry/<type>/<domain>/`, `logic/<domain>/`, `data/<entity>/`, `actions/`, `actionProcessor/`, `types/` (private backend-only shapes). Framework-wired entries (`entry/eventDocs.ts`, `entry/queueEvent/<name>.ts`, `entry/inlineFunction/`) may sit flat.

**P2. Controllers.** A controller is: auth helper, route `schema:` (zod on the route definition; the parsed payload arrives as the third handler argument and is published to OpenAPI), one logic call, `toJsonEventResponse`. No lookups, grant checks, id generation, enqueueing or hand-built error bodies. Route exports are bare verbs; the inner generator is `<verb><Noun>`. Health responses share one shape.

```ts
export const create = tenantedRoute(
  ['POST', ENVELOPES_BASE_PATH],
  function* createEnvelope(event, params, input) {
    const actor = yield* askUserActor(event);
    const envelope = yield* askEnvelopeCreate(actor, input);
    return toJsonEventResponse(envelope);
  },
  { schema: envelopeCreateSchema, permission: ENVELOPE_CREATE },
);
```

**P3. Layering and data.** `entry` calls `logic` calls `data` (C7). Only `data/` touches storage, drive names, keys and paths; logic reads the scope and passes it in. Data folders are per entity. Event-doc append wrappers are typed per effect: `askXAppendEvent<E extends XEffect>(id, type: E, data: XEffectData[E])`.

**P4. Models.** A shape crossing a layer is a named model in `models/`, one per file. `x-logic` holds logic only; its types live in `models/`, its constants in `config/`. `Nullable` comes from one place.

**P5. Constants.** Every resource name, port, path, permission and bus name is a constant in the service's `config/constants/`, one per file (G8). Repeated `define*` option blocks become one app helper in the app's `service-utils`. App-level packages hold only cross-service identifiers; a store or path used by one service lives in that service's `config/`.

**P6. Shared helpers.** A helper used by two or more services lives in the app's `service-utils` or the owning service's `service-utils` (G2). Unused helpers are deleted.

**P7. Errors and logging.** Caller mistakes throw the narrowest `ErrorTypeEnum` (`BadRequest`, `Forbidden`, `NotFound`), never `GenericError`; `Invalid` is for request validation only. Action error types map to HTTP via `knownErrors`. Every `askCatch` either rethrows or logs; no double-wrapping. `askLog` (tagged template) is for info; warnings and errors go through `askLogCreate(level, ...)`.

**P8. Outbound callbacks** to customer-supplied URLs go through one shared helper that refuses private and reserved addresses and signs the request.

**P9. The app's CLAUDE.md is updated in the same commit** as any code it describes (route helpers, examples, scripts, package rules).

---

## Tests

**T1. Files.** `<subject>.test.ts(x)` beside the subject, importing from `vitest`. No `.spec`. **lint**

**T2. Helpers.** Requesters are tested with `captureRequester`, stories with `runStory` (mock actions by type), config with `buildTestQpqConfig`, state logic with `askReduceState`. All of them live in `@qpqjs/testing`; nothing test-related is exported from a runtime package's main entry.

**T3. Mock at the boundary.** `vi.mock` is used only for I/O boundaries (an AWS SDK client, `fs`, `child_process`, `fetch` inside its own wrapper). Never a sibling `@qpqjs` package, never a pure helper. Framework code under test is real.

**T4. Fixtures.** `as any` is allowed in tests. Once the same shape is cast in three or more test files it gets a typed builder in `@qpqjs/testing`.

**T5. Coverage.** Every action processor and every `define*` has a sibling test (processors are the runtime-parity surface, defines are public API). Tests elsewhere are encouraged. Timers are faked, never slept.

**T6. Vitest config is one line**: `defineQpqVitestConfig(import.meta.url)` builds the `@qpqjs/*` source aliases from the package's dependencies.

**T7. Smoke suites.** One folder per suite: `<domain>SmokeSuite.ts`, `config/`, `logic/askRun<Domain>Test.ts`, `entry/`, `index.ts`. A suite is registered by appending one line; a cross-service half mirrors the folder name in the probe service.

---

## Lint, tooling and packages

**H1. Lint** runs in CI for every repo. On: `no-unused-vars` (`^_` ignored), `prefer-const`, `consistent-type-definitions: type`, `no-console` with an allowlist, the `no-restricted-syntax` selectors behind the rules marked **lint** above, the vitest plugin, JSDoc as a warning, and the custom `qpq/*` rules (one export per file, file name matches export, `ask` prefix, `yield*`). Off by decision: `no-explicit-any`, `ban-ts-comment`. One prettier config ships with `@qpqjs/eslint-config` and is used by every repo.

**H2. TypeScript.** The shared base is strict plus `noUncheckedIndexedAccess` and `noImplicitOverride`, enabled package by package. Each package has `tsconfig.json` (editor), `tsconfig.esm.json` and `tsconfig.commonjs.json`, nothing else.

**H3. Packages.** Every package publishes an `exports` map whose `types` match the served format. `test` is `vitest run`. A production import of a sibling is a `dependencies` entry; a test-only import is a `devDependencies` entry; `@types/*` are devDependencies. A CI check fails on an undeclared or unused dependency. Test fixtures are excluded from `files`. `clean` removes `lib` and `node_modules` (the latter on purpose, to flush registry shadow copies).

**H4. Dependencies.** One date library per repo. Ids come from `generateUuid` or the sortable-id helper. No lodash.

**H5. Docs.** Every package has a README whose first heading is the package name. Plans and todo lists live outside the repo root (the framework uses `../qpqjs-files/`; an app uses `docs/`).
