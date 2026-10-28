# Moonshot: one story loop, two drivers (a sync runtime for QPQ)

**Target:** the qpq runtime (`packages/core/src/runtime`) and the browser runtime that wraps it (`packages/web-react/src/runtime`, `packages/web-react/src/hooks/useQpq.ts`). The author's description: the runtime treats every action as async, but the state dispatch effect the frontend uses is sync by nature. They want two runtime modes, sync and async, a way to declare which action processors can run sync, and a sync path for things like state updates on a key event in a text field.
**Date:** 2026-10-28

## Today

A story is a generator that yields actions. `resolveStory` (`packages/core/src/runtime/resolveStory.ts`) runs it: it awaits the processor list, then for every yielded action it awaits `processAction` (`packages/core/src/runtime/processAction.ts`), which awaits the processor. `ActionProcessor` (`packages/core/src/types/Action.ts`) is typed as returning `AsyncActionProcessorResult<T>`, so there is no such thing as a sync processor. `createRuntime` returns a function that returns `Promise<StoryResult>`. There is exactly one loop and it is async all the way down.

In the browser, `useQpq` builds that runtime once per context change and `useQpqRuntime` wraps each api story in it. A keystroke in admin's new-password form goes `onChange` -> `api.authChallengeSetPasswordA(value)` -> async resolver -> `resolveStory`, which re-resolves the whole processor list (`getWebActionProcessors` is six nested awaited spreads, then the context processors, then the area's state processors) -> awaits `processAction` -> `getStateDispatchActionProcessor` calls `dispatch`, which runs the reducer and `store.setAreaState`, which notifies `useSyncExternalStore`. The dispatch itself is sync, but it lands eight or more microtasks after the event handler returned. React has already committed the controlled input with the old value by then, so the field flickers, the caret jumps and the "controlled to uncontrolled" class of bugs appears.

The cost everyone has quietly accepted:

- `useFieldBinding` (`packages/web-react/src/useFieldBinding/useFieldBinding.ts`) exists only to paper over this: it keeps a local `useState` mirror that is set synchronously, then calls the real setter and later reconciles. Every text input bound to qpq state either uses it or lives with the lag.
- The processor list is rebuilt on every story run, on every keystroke, because `getActionProcessors` is a resolver called inside `resolveStory`, not a list.
- `runStory` (`packages/core/src/testing/storyTesting.ts`) already contains a sync loop (`drive`) because tests want sync; it is a second, smaller runtime kept in step by hand with the real one.
- `askReduceState` (`packages/core/src/stories/state/askReduceState.ts`) is a third way of running state effects without the runtime, again because the runtime cannot be run sync.
- `qpqExecuteLog` replays a log through the async loop with a Proxy of async no-op processors; a sync replay would step in a debugger.

Incremental fixes have not moved the needle because the thing that needs changing is the shape of the loop, not any one processor. Caching the list helps the async path a little; it does nothing for the controlled input problem.

## The moonshot

Sync becomes a property of each action processor, declared where the processor is registered, and the runtime gains one story loop with two drivers over it. The loop (a "stepper") is written once: it owns the session, the history, depth limits, `returnErrors` shaping and error mapping, and it hands each action out to whoever is driving it. The async driver is today's behaviour, byte for byte in the `StoryResult` it produces. The sync driver runs the same loop without a single `await`, and refuses, before invoking it, any processor that is not marked sync, so a strict sync run can never half-launch a network request.

On top of the two drivers sits an eager mode: a story starts running synchronously the moment it is called, and only becomes a promise at the first action whose processor is async. For the frontend that means `api.setPasswordA(value)` applies its state dispatch inside the React event handler, in the same tick, before the call returns; the promise it hands back is for whatever comes after. Nothing in the story changes. The story that does "dispatch optimistic update, then network call, then dispatch result" gets its optimistic update applied synchronously for free.

What becomes possible that is not possible today:

- A text field bound straight to a qpq api story with no local mirror and no caret jump. `useFieldBinding` shrinks to a value extractor.
- A strict sync api (`useQpqSyncRuntime`, or `api.sync`, see open questions) for code that needs the return value now: value extractors, reducers that call a story, render-time compute, anything inside `useSyncExternalStore`.
- One loop for production, tests and replay. `runStory` becomes "the sync driver with mocked processors", `qpqExecuteLog` steps a log synchronously under the debugger, and `askReduceState` keeps working unchanged (it is a story, not a runtime) but is no longer the only sync way to fold effects.
- A processor list resolved once per runtime instead of once per story, which is a measurable win on the backend too (a Lambda route today re-resolves its list for every nested `askExecuteStory`).
- Sync nested stories: an inline function or batch whose every action is sync runs sync, so a reducer-style story composed of other stories stays sync end to end.

## Why not sooner

The loop is one 200 line async function that threads session, history, logs and error mapping; a second sync copy looked like two loops to keep in step forever. The processor contract is `=> Promise<...>` across roughly 280 processors in five packages and about 100 hand-written aggregator resolvers, so changing it looked like touching every file in `actionprocessor-*`. That no longer applies: nearly every processor now goes through `createActionProcessor` and every requester through `createActionRequester`, so the contract lives in two helpers. `askOverrideActions` and `runStory`'s `drive` already prove the generator-stepping pattern fits in forty lines. The mechanical sweep of aggregator resolvers is the kind of work that is now cheap.

## Alternatives considered

- **Take UI state out of the runtime entirely.** `askUI*` creators become plain reducer dispatches on the store, stories only orchestrate async work. Lost because it splits the programming model in two and loses `runStory`, logging and replay for exactly the code that has the most bugs.
- **Prove sync-ness in the type system.** A `SyncAskResponse<T>` the checker threads through `yield*`. Lost because a story is sync in one runtime and async in another (the same `askDateNow` is sync in the browser and could be a clock service elsewhere); sync is a runtime property, not a story property. A lint rule may come later.
- **A first-action fast path.** Keep the async loop but peek at a story's first yield and apply it synchronously if it is a state dispatch. Lost because it is the eager driver with a cliff after one action, and nobody could predict where the cliff is.
- **Replace the generator runtime with an effect library.** Lost because it throws away the log format, the admin viewer, replay and every consumer's stories for a benefit the stepper gives us anyway.
- **Move stories to a Web Worker.** Lost because it makes sync impossible by construction.

## Risks and unknowns

- **Zalgo.** An api that is sometimes sync and sometimes async is a classic footgun. The design avoids it with explicit surfaces: the strict sync api returns values and throws `SyncRuntimeError`; the eager api always returns a promise, and the only observable difference from today is that state is already updated when the call returns. Document both.
- **Reentrancy.** A sync dispatch notifies store subscribers inside the story, inside the React event handler. A subscriber that calls another sync story runs nested in the same tick. Each run has its own generator and the store already copies its listener set before notifying, but this needs tests, and `useQpqAreaBinding`'s `getCurrentState` must read the store, not a render-time snapshot (it already does).
- **Error text and logs (compliance).** `processAction` keeps an exception's message in `errorStack` and gives callers a generic text so a failure cannot name resources, paths or accounts. The sync path must go through the same mapping, including sync throws from a sync processor, and sync batches must keep the same `returnErrors` semantics. No new data is logged: browser runtimes keep the no-op logger, backend logs keep their shape. `StoryResult` may gain an optional execution mode field; the admin log store tolerates optional fields, but confirm before storing it (open question).
- **Auth and tenant isolation.** Unchanged. The sync runtime takes the same `StorySession`, the nested sync runtime applies the same rule as `createNestedRuntime` (the raw `accessToken` never reaches a child story, local context never crosses a service boundary). Any sync processor registered by a consumer runs with the session it is given, as today. Review `createSyncActionProcessor` uses in the features package for anything that reads `decodedAccessToken`.
- **Federation.** `@qpqjs/core` is in `FEDERATED_SHARED_PACKAGE_NAMES`. Widening `ActionProcessor` and `ActionProcessorListResolver` return types is type-only, but a remote built against a core without `createSyncActionProcessor` will fail to load against a host that has it only if the remote imports it. Hosts and remotes move together, as with every core change.
- **Consumers who implement resolvers.** doccypoccy and the site app register processors through `createActionProcessor` and hand-written `async` resolvers. Both keep working: the async driver awaits everything, and `await` on a plain value is a no-op. A consumer calling a resolver and chaining `.then` directly would break; listed as breaking.
- **Performance regressions on the backend.** `processAction` stops being an `async` function. The semantics are the same but the microtask profile changes; the core suite is thorough and `createImplementationRuntime` and the Lambda handlers get a smoke run on the dev server.
- **Unknown:** whether the Redux DevTools connection (`connectQpqStoreToReduxDevTools`) copes with several sync `set_state` events inside one React event. Expected yes, verify.

## Phases

### [ ] Phase 1: Processor kinds (~2 weeks)
- **Goal:** A processor can be sync, the runtime can tell, and `processAction` returns a sync result without wrapping it in a promise.
- **Done when:** `createSyncActionProcessor` exists in `@qpqjs/core`, `isSyncActionProcessor` identifies it, `processAction` returns the plain tuple for a sync processor and a promise for an async one (tested both ways, including a sync throw mapped to the same generic error text), and the full test suite passes with the listed processors converted. No behaviour change for any caller.
- **Work:**
  - `packages/core/src/types/Action.ts`: `ActionProcessor` returns `MaybePromise<ActionProcessorResult<T>>` (new `MaybePromise<T>` in `types/`). Add `SyncActionProcessor<TAction, TReturn>` returning the tuple, and a `SyncActionProcessorBrand` marker (a readonly property on the function, same pattern as `createActionRequester` attaching `actionType`).
  - `packages/core/src/types/utils/createSyncActionProcessor.ts` (+ `isSyncActionProcessor.ts`, `ProcessorFor` gains a `SyncProcessorFor`), exported from the barrels. `createActionProcessor` keeps working for async processors.
  - `packages/core/src/runtime/processAction.ts`: no longer `async`. Keep the prototype-key guard and context merge; call the processor; if the result is a thenable attach the existing error mapping with `.catch`, otherwise return it. Sync throws go through the same `actionResultError` mapping.
  - `resolveStory` and `getSystemBatchActionProcessor` keep awaiting (await on a value is fine).
  - Convert to sync in `packages/actionprocessor-js`: date now, guid new / sortable / sortable many, math random, context read / list, config get application info / get global, error throw, log create / template literal / redact, platform get name. In `packages/web-react/src/runtime/actionProcessor`: state dispatch and state read. Leave anything that touches the network, storage, crypto, delay, streams or dynamic loading async.
  - Tests beside each converted processor assert the result is not a promise.
- **Breaking:** none. (`ActionProcessor`'s return type widens; nothing that calls a processor directly except the runtime and the batch processor, both updated.)

### [ ] Phase 2: One loop, two drivers (~3 weeks)
- **Goal:** `resolveStory` becomes a stepper driven by either an async or a sync driver, and a runtime can be built around a resolved processor list.
- **Done when:** `createSyncRuntime(...)` returns `(story, args) => StoryResult`, a story of only sync actions runs through it with a `StoryResult` deep-equal to the async driver's (same history, session, tags, error shapes; timestamps from the injected clock), a story that reaches an async-only processor fails with `SyncRuntimeError` naming the action type before the processor is invoked, and every existing `createRuntime` caller is unchanged.
- **Work:**
  - `packages/core/src/runtime/createStoryStepper.ts`: a generator that owns everything `resolveStory` does between actions (session seeding, functionGlobals rule, depth limit, history entries, `returnErrors` shaping, error mapping, `StoryResult` assembly) and yields `{ action, session }` steps, receiving `ActionProcessorResult`s. `resolveStory.ts` becomes `driveStoryAsync` over it; `driveStorySync.ts` is the new driver. `resolveStoryWithLogs` gets a sync twin that shares the console collector stack.
  - `packages/core/src/types/Action.ts`: `ActionProcessorListResolver` returns `MaybePromise<ActionProcessorList>`. `createActionProcessor` returns a sync map when `getProcessor` returns a value. New `combineActionProcessorResolvers(resolvers)` in `packages/core/src/runtime/` that stays sync when all parts are, and `resolveActionProcessorListSync` that throws when one is not. Sweep the hand-written `async (qpqConfig, loader) => ({ ...(await a()), ...(await b()) })` aggregators in `actionprocessor-js`, `actionprocessor-web`, `web-react` and `features` onto the combiner (roughly 100 files, mechanical).
  - `createRuntime` accepts a resolver or a list; when given a list it skips the per-story resolve. `createSyncRuntime` requires a list or a sync resolver. `createNestedRuntime` gains `createNestedSyncRuntime` with the same session rules.
  - `packages/core/src/runtime/index.ts` barrel, tests for the stepper (drive the same story through both drivers and compare), the sync driver's refusal path, and the combiner.
- **Breaking:** `ActionProcessorListResolver` may now return a plain list; code that calls a resolver and chains `.then` must `await` it instead. Goes in `breaking-changes.md` under vNext.

### [ ] Phase 3: Browser: eager api and strict sync api (~2 weeks)
- **Goal:** A frontend api call applies its sync prefix inside the React event handler, and a strict sync api returns values synchronously.
- **Done when:** In admin, `AuthChallengeNewPasswordRequired` and the login form bind their inputs straight to the api with no `useFieldBinding` mirror and the caret stays put under rapid typing (test in `web-react` with `act`: call `api.setX('a')` and assert the store already holds `'a'` before any `await`). A strict sync call to a story that hits `askNetworkRequest` throws `SyncRuntimeError` and launches nothing.
- **Work:**
  - `packages/core/src/runtime/driveStoryEager.ts`: runs the stepper sync until the first processor that is not sync (or a step whose result is a promise), then hands the remaining steps to the async driver; returns `StoryResult | Promise<StoryResult>`. `createRuntime`'s resolver gains an eager variant.
  - `packages/web-react/src/hooks/useQpq.ts`: resolve the processor list once per memo (the `useEffectCallback` wrappers keep the latest per-area processors; resolution moves to the memo, not the story), build async, sync and eager drivers from it. `getStoryExecutor` uses the eager driver and still returns a promise, so `QpqMappedApi` is unchanged. Add a sync executor that returns the value and throws on `SyncRuntimeError`.
  - `packages/web-react/src/runtime/useQpqSyncRuntime.ts` (or `api.sync`, open question) with `QpqMappedSyncApi<TApi>`; `useQpqAreaBinding` hands both resolvers out. `QpqRuntimeDefinition.onInit` stays async.
  - `useFieldBinding`: when the setter is sync the local mirror is skipped; keep the mirror for async setters so nothing regresses. Update admin's auth forms and `Login.tsx` as the reference usage.
  - Verify Redux DevTools under several sync `set_state` events in one tick.
- **Breaking:** none. Default api stays promise-returning; state is simply already updated when the promise is handed back.

### [ ] Phase 4: Batches, nested stories, tests and replay on the sync driver (~2 weeks)
- **Goal:** Composition stays sync when its parts are, and the test and replay tools run on the real loop.
- **Done when:** `askRunParallel` over sync actions runs sync (sequentially, same result order and `returnErrors` semantics as the async batch), `askExecuteStory` of a sync story runs through `createNestedSyncRuntime`, `runStory`'s private `drive` is deleted in favour of the sync driver with `mockActions` registered as sync processors (all existing story tests pass unchanged), and `qpqExecuteLog` replays a log synchronously.
- **Work:**
  - `packages/actionprocessor-js/.../getSystemBatchActionProcessor.ts`: a sync-capable batch. If every child's processor is sync, run them in order and return the tuple; otherwise fall back to `Promise.all` as today. Same failure rule (first non-`returnErrors` failure fails the batch).
  - `getSystemExecuteStoryActionProcessor` (`actionprocessor-aws`) and `getInlineFunctionExecuteActionProcessor` (`actionprocessor-node`) try the nested sync runtime first when their own list is sync-resolvable; the user-script and dynamic-function processors stay async (child process, dynamic import).
  - `packages/core/src/testing/storyTesting.ts`: `runStory` builds a sync runtime whose processor list is the mock map turned into sync processors; `throwsError`, the empty-batch answer and the unmocked-context default move to processors. `askOverrideActions` stays as the production interception story.
  - `packages/core/src/qpqExecuteLog.ts`: the replay Proxy returns sync processors; the runtime becomes the sync one so the debugger steps without promise hops.
  - `createImplementationRuntime` gets a sync sibling only if a consumer needs it (not planned).
- **Breaking:** `runStory` now rejects a mock that returns a promise (it never supported them, but it silently passed the promise through before). Note it in `breaking-changes.md`.

### [ ] Phase 5: Diagnostics and developer experience (~1 week)
- **Goal:** Authors can see why a story went async and the docs describe the two surfaces.
- **Done when:** `SyncRuntimeError` reports the action type and the story's action history up to it; `StoryResult` carries an optional `executionMode` (`sync`, `async`, `eager`) the admin log viewer shows; a dev-only console warning fires when a strict sync api call fails; `qpq-docs` and the package READMEs describe sync processors, the eager default and the strict sync api; `breaking-changes.md` entries from phases 2 and 4 are reviewed into one release note.
- **Work:**
  - `packages/core/src/types/StorySession.ts`: optional `executionMode` on `StoryResult`, set by each driver. `packages/web-admin` log detail shows it.
  - `SyncRuntimeError` in `packages/core/src/runtime/` with `actionType`, `history` and a one-line hint ("register the processor with createSyncActionProcessor or call the async api").
  - `features` audit: every `askUI*` creator is sync by construction; add a test in `features` that runs each module's api through the sync driver with the state processors only and lists which stories need async, as living documentation.
  - Docs in the `qpq-docs` repo (separate repo, note only), README sections in `core` and `web-react`.
- **Breaking:** none.

## Open questions

1. **Eager by default?** Phase 3 makes every frontend api call eager (promise returned, sync prefix already applied). The alternative is opt-in per story. Eager is recommended because it fixes every bound input at once with no call-site change; the cost is that a story's first side effects now happen before the caller's `await`, which is only observable if a caller relied on the gap.
2. **Shape of the strict sync api.** A separate hook (`useQpqSyncRuntime(definition)` returning `[syncApi, state, dispatch]`) or a namespace on the existing api (`api.sync.setX()`). The hook keeps `QpqMappedApi` untouched and is recommended; the namespace is fewer hooks per component.
3. **Trust or declare for consumer processors.** Strict sync mode refuses processors not marked with `createSyncActionProcessor`. Eager mode could instead detect sync-ness from the return value and trust it. Recommended: declare for strict, detect for eager. Confirm.
4. **Store `executionMode` in backend logs?** It is a small optional field on every stored `StoryResult`. Fine for the log tables as far as the code goes; confirm it is wanted in the admin log view and the log retention story before Phase 5.
