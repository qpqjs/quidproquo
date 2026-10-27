# Effects: requesters own the effect, reducers pair them with updaters

**Verdict:** improvement
**Status:** draft
**Branch:** not created yet (no GitHub issue)

## Summary

Make an effect's action creator the single place that effect is defined. A `createActionRequester`-style helper takes the effect type string and a payload builder, and returns the `ask*` creator with its type and payload builder attached. A new reducer builder takes a list of creator and updater pairs, so the updater's payload is typed from the creator. That removes the `effects/` folder (enum, per-effect files, union) and the hand-written creator bodies from every state module.

Updaters stay out of the definition. One effect is often handled by several updaters in different reducers, and that pairing belongs to each reducer, not to the effect.

## Background

Every effect today is spread over:

- an enum member (`effects/[Module]Effect.ts`)
- an effect file with the payload type and the `Effect` type
- a line in the module's union (`effects/[Module]Effects.ts`)
- an action creator in `actionCreators/`
- one or more updaters in `stateUpdaters/`
- a line in the reducer wiring, keyed by the enum

The creator is nearly always the same three lines:

```ts
export function* askUIEventEditorSetConfig(config: EventEditorConfig): AskResponse<void> {
  yield* askStateDispatchEffect<EventEditorSetConfigEffect>(EventEditorEffect.SetConfig, config);
}
```

There are about 90 of these through `askStateDispatchEffect` and about 13 through `askApplyEventDocEvent` in this repo, and many more in doccypoccy (the `eventEditor` module in `packages/exengne/logic/src/modules/eventEditor/` alone has 17 creators and 19 effect files).

Problems with the current shape:

- **A lot of files say the same thing.** The effect type and payload are declared once in the effect file and repeated in the creator and the reducer key.
- **The type check is opt-in.** Both dispatchers take the effect as an explicit generic. Leave it off and it falls back to `Effect<any, any>`, so nothing is checked.
- **Tests can't tell effects apart by creator.** Every UI effect is the same `StateDispatch` action, so tests match on type strings. Action requesters carry `.actionType` for exactly this; effect creators carry nothing.

Redux Toolkit settled on the same shape (`createAction` with `.type`, then `builder.addCase(action, reducer)`), which is some evidence it holds up.

## What it looks like

```ts
// actionCreators/askUIEventEditorSetConfig.ts
/** Replaces the editor config. */
export const askUIEventEditorSetConfig = createStateEffectRequester({
  effectType: 'eventEditorSetConfig',
  getPayload: (config: EventEditorConfig) => config,
});

// actionCreators/askUIEventEditorReset.ts (no payload)
/** Clears the editor back to its initial state. */
export const askUIEventEditorReset = createStateEffectRequester({
  effectType: 'eventEditorReset',
});

// stateUpdaters/setLoading.ts (payload declared inline in the creator)
export const setLoading = <T>(state: EventEditorState<T>, payload: EffectPayloadOf<typeof askUIEventEditorSetLoading>) => ({
  ...state,
  isLoading: payload.isLoading,
});

// createEventEditorReducer.ts
export const createEventEditorReducer = <TExperience>() =>
  buildEffectReducerFrom<EventEditorState<TExperience>>()([
    onEffect(askUIEventEditorReset, reset),
    onEffect(askUIEventEditorSetConfig, setConfig),
    onEffect(askUIEventEditorSetLoading, setLoading),
  ]);
```

Why a list of pairs and not an object or `Map`: functions can't be object keys, and a `Map` can't link each key's payload type to its value's. `onEffect` exists only to type-check one pair. The list reads top to bottom and lets the builder reject duplicates.

The `ask-prefix-generator-only` eslint rule only checks function literals, so `const askX = createStateEffectRequester(...)` is already legal (same as `askQueryParamsSet`).

## Affected packages

- `@qpqjs/core`: requester helper, reducer builder, `onEffect`, type helpers, tests.
- `@qpqjs/features`: event-doc versions of the requester and fold builder, validator typing, trial conversions.
- `@qpqjs/web-admin`: conversions only, when those modules are next touched.
- `CLAUDE.md`: module structure table and the event-doc paragraph.
- doccypoccy (follow-up, other repo): convert modules after a release, starting with `eventEditor`.

## Approach

### Requesters (packages/core/src/logic/stateEffects/)

1. `EffectRequesterDefinition.ts`: `{ effectType: TType; getPayload?: (...args: TArgs) => TPayload }`.
2. `EffectRequesterFunction.ts`: callable `(...args: TArgs) => AskResponse<void>`, with `effectType: TType` and `getPayload` attached, like `ActionRequesterFunction` (`packages/core/src/types/ActionRequesterFunction.ts`).
3. `EffectDispatcher.ts`: `<TEffect extends Effect<string, any>>(type: TEffect['type'], payload: TEffect['payload']) => AskResponse<void>`. `any` for the same variance reason as `AnyActionRequesterFunction`, with that comment. `askStateDispatchEffect` and `askApplyEventDocEvent` both already fit.
4. `createEffectRequesterFor.ts`: `(dispatch: EffectDispatcher) => <TType extends string, TArgs extends unknown[] = [], TPayload = undefined>(definition) => EffectRequesterFunction<TType, TArgs, TPayload>`. A single call, not curried: there is no outer effect generic any more, the type is inferred as a literal from `effectType` and the payload from `getPayload`'s return. A missing `getPayload` becomes `() => undefined`, like `createActionRequester`.
5. `createStateEffectRequester.ts`: `createEffectRequesterFor(askStateDispatchEffect)`.
6. Type helpers, one per file: `EffectOf<TRequester>` (the `Effect<TType, TPayload>` it sends), `EffectPayloadOf<TRequester>`, and `AnyEffectRequesterFunction` for constraints.

### Reducers (packages/core/src/logic/stateEffects/)

7. `EffectHandlerPair.ts`: `{ requester; updater: (state: TState, payload: EffectPayloadOf<TRequester>) => TState }`.
8. `onEffect.ts`: `(requester, updater) => EffectHandlerPair`, typed so the updater's payload must match the requester.
9. `buildEffectReducerFrom.ts`: `<TState>() => (pairs) => QpqReducer<TState, union of EffectOf for each pair>`. Curried so the state type is pinned while the pairs are inferred. Builds a lookup by `requester.effectType` with own-property checks, the same as `buildEffectReducer` (effects are replayed from stored logs, so `'toString'` must stay unhandled). Throws at build time if two pairs share an effect type. Returning the union of handled effects means modules no longer hand-write a union for `QpqReducer` or `combineQpqReducers`.
10. Keep `buildEffectReducer` as it is. Both builders live side by side while modules move over.

### Event docs (packages/features/src/eventDoc/)

11. `actions/eventDocEvent/createEventDocEffectRequester.ts`: `createEffectRequesterFor(askApplyEventDocEvent)`.
12. Event-doc updaters receive the payload wrapped in `EventDocEventPayload<T>` (see `fold/EventDocFoldEffects.ts`). Add `fold/onEventDocEffect.ts`, which types the updater as `(state, payload: EventDocEventPayload<EffectPayloadOf<TRequester>>) => TState`, and `fold/buildEventDocFoldReducerFrom.ts`, the pair-based twin of `fold/buildEventDocFoldReducer.ts` (combines `buildEventDocBaseReducer` with the domain pairs, returns `QpqReducer<TState, domain | ReservedEventDocEffects>`).
13. Validators (`validation/types/EventDocEventValidators.ts`) are keyed by a module's effect union. For now modules build that union with `EffectOf<typeof askX> | ...` in one line. A pair-based validator registration is a separate follow-up if that line proves annoying.
14. The reserved `EventDocEffect` events stay as they are in this change. They are handled by two reducers each (summary and base fold), which the pair approach supports, but they are core to every stored log and don't need to move first.

### Stored type strings

15. Event-doc event types are persisted and replayed, so a converted creator's `effectType` must be exactly the old enum value (for example `'workspaceChromeSetHistoryOpen'`), never derived from the function name. UI effects are not stored, but keep their strings too so logs and devtools stay readable across the change. Each trial conversion gets a test asserting every creator's `effectType` against the old enum value, written before the enum file is deleted.
16. What a creator sends must not change: event docs keep `{ eventType, data }` with `data: undefined` when payload-less, UI effects keep `{ type, payload }` with `payload: undefined`. The helper changes how creators are written, not what they dispatch.

### Tests

17. Core, `runStory` with a `StateActionType.Dispatch` mock: the requester dispatches `{ type, payload }`; payload-less dispatches `payload: undefined`; `.effectType` and `.getPayload` are attached.
18. Core reducer builder: routes each effect to its updater; returns `[state, false]` for unknown types and for `'toString'`; throws on a duplicate effect type; two reducers pairing the same requester with different updaters both handle it (the multiple-updater case, combined with `combineQpqReducers`).
19. Type-level cases with `// @ts-expect-error`: updater payload not matching its requester, requester called with wrong arguments, a non-literal `effectType` (a plain `string`) losing the type link. Then confirm these are actually checked: run `tsc --noEmit` against a tsconfig that includes test files and temporarily remove one `@ts-expect-error` to watch it fail. If no typecheck covers the test files, say so and add one rather than trusting a green run.
20. Features: the event-doc requester yields the same `ApplyEvent` action as `askApplyEventDocEvent` for the same input; `buildEventDocFoldReducerFrom` folds the reserved events and domain pairs.
21. `npm run test` for core and features, `npm run build -w @qpqjs/core -w @qpqjs/features`, `npm run lint`.

### Trial conversion (this repo)

22. Two modules, one of each kind, with existing tests passing unchanged apart from switching string matches to `.effectType`:
    - `packages/features/src/tenant/membership/` (6 UI effects; `logic/askTenantMembershipUiLoad.test.ts` covers it).
    - `packages/features/src/eventDoc/workspace/chrome/` (4 event-doc effects, the canonical example in CLAUDE.md).
    For each: type-string test first (step 15), convert creators, convert updaters to `EffectPayloadOf` or a domain type, swap the reducer to the pair builder, build the validator union if one exists, delete `effects/`, update barrels and any consumer that imported an effect or payload type.
23. Stop and review with Joe before converting anything else.

### Docs

24. `CLAUDE.md`, module structure table: drop the `effects/` row. `actionCreators/` becomes "one `ask*` per file, built with `createStateEffectRequester`; the effect type string lives here and nowhere else". `stateUpdaters/` takes its payload type from `EffectPayloadOf<typeof askX>` or a named model. The reducer is built with `buildEffectReducerFrom` and `onEffect`. Rewrite the event-doc paragraph the same way. Keep the rule that logic stories call creators, never a dispatcher directly.

### Rollout

25. Convert the rest module by module as they are touched, not in one sweep. Creators that do more than send one effect (for example `packages/web-admin/src/Auth/**/authActionCreator.ts`, `packages/web-admin/src/platformLogic/effects/system/systemActionCreators.ts`) become plain stories that call requesters.
26. Additive, not breaking: `buildEffectReducer`, `buildEventDocFoldReducer`, `askStateDispatchEffect` and `askApplyEventDocEvent` stay public. Changelog entry through the `changes` skill at release.
27. doccypoccy, after the release lands there: convert `eventEditor` first. Its updaters are generic over the experience type (`setConfig = <T>(state: EventEditorState<T>, ...)`), which is a good check that `onEffect` accepts generic updaters under a pinned state type. Its experience reducers go through `getEventEditorExperienceReducer`, which is generic over the effect type and should need no change.

## Risks

- **Changed type strings break stored event docs.** Covered by step 15. This is the one data risk; nothing else touches what is stored or sent.
- **Updaters now import from creators** (type only, via `EffectPayloadOf`). This flips today's direction, where both import from `effects/`. It can't loop because creators never import updaters, but it does mean `stateUpdaters/` depends on `actionCreators/`.
- **Two styles side by side** until the rollout finishes. Acceptable, since the old builders stay and CLAUDE.md will say which is preferred.
- **Type strings were namespaced by the enum file.** Uniqueness now relies on each definition following the `<module><Verb>` naming already in use; the duplicate check only catches clashes within one reducer.

## Open questions

- [ ] Names: `createStateEffectRequester`, `createEventDocEffectRequester`, `createEffectRequesterFor`, `buildEffectReducerFrom`, `onEffect`, `onEventDocEffect`, `EffectOf`, `EffectPayloadOf` are placeholders.
- [ ] Literal inference: confirm `effectType: 'eventEditorSetConfig'` infers as the literal, not `string`, without `as const`. If not, use a `const` type parameter.
- [ ] Should requesters also carry `match(effect): effect is EffectOf<...>` (as Redux Toolkit does) for tests and the odd hand-written reducer, or is `.effectType` enough?
- [ ] Inline payload shapes like `{ isLoading: boolean }`: leave them inline in `getPayload` and read them through `EffectPayloadOf`, or require a named type in `types/` when the updater needs it? The cross-layer rule in CLAUDE.md leans towards naming them.
- [ ] Should the reserved `EventDocEffect` events move to requesters in a later change (step 14)?

## Changelog

- 2026-10-14: created from a chat with Joe. First draft was dispatch-only; reworked so requesters replace `effects/` and reducers pair requesters with updaters, after looking at doccypoccy's `eventEditor` module.
