# Testing

Tests run on [Vitest](https://vitest.dev): `npm test` at the root runs every package, `npm run test -w @qpqjs/<pkg>` runs one, `npm run test:watch`
watches. A test file sits beside the code it covers as `<name>.test.ts` (rule T1 in `docs/code-standards.md`). Every helper named below comes from
`@qpqjs/testing`, which each package lists as a devDependency. Nothing test-related is exported from a runtime package (T2).

Each package's `vitest.config.ts` is one line, `defineQpqVitestConfig(import.meta.url)`, which aliases every sibling package to its `src`, so tests
never run against a stale build (T6).

## Requesters: `captureRequester`

An action requester yields exactly one action and returns whatever the runtime answers. `captureRequester` drives that single round-trip and hands
back both the action and the returned value.

```ts
import { captureRequester } from '@qpqjs/testing';

const { action, returned } = captureRequester(askConfigGetParameter('name'), 'value');

expect(action).toEqual({ type: ConfigActionType.GetParameter, payload: { parameterName: 'name' } });
expect(returned).toBe('value');
```

It throws if the generator yields nothing or yields twice, so a story that is not a plain requester fails loudly instead of passing by accident.

## Stories: `runStory`

`runStory` runs a story to completion, answering each action from a map keyed by action type. It is built on `askOverrideActions`, so
`askRunParallel`, nested stories and `askCatch` all behave as they do at runtime.

```ts
import { expectError, runStory, throwsError } from '@qpqjs/testing';

const result = runStory(askKeyValueStoreQueryAll('items', keyCondition), {
  // a literal value...
  [KeyValueStoreActionType.Query]: { items: ['a', 'b'] },
  // ...or a function of the action, which also works as a spy
  [DateActionType.Now]: (action) => '2024-01-01T00:00:00.000Z',
});

expect(result).toEqual(['a', 'b']);
```

- A mock is the raw success value. `askCatch` wrapping is applied for you, so the same mock works whether or not the story catches.
- Simulate a failure with `throwsError(errorType, errorText)`. Under `askCatch` it comes back as a failed `EitherActionResult`; otherwise it
  propagates as a thrown `StoryError`.
- Every action must be mocked. Anything that reaches the runtime throws a descriptive error, so a test cannot silently pass against an unstubbed
  dependency.
- Narrow an `EitherActionResult` with `expectError(result)` rather than a hand-written `if (result.success)` guard.
- Assert on requests with the function form of a mock (or a `vi.fn`) and check the action it received.

`packages/testing/src/storyTesting.test.ts` shows the full surface; `packages/core/src/stories/askRetry.test.ts` is a representative composed-story
test.

## Config: `buildTestQpqConfig`

Most config selectors need an application module before they can resolve names. `buildTestQpqConfig` prepends a default one (`test-app`,
`test-module`, `development`) and takes just the settings the test is about, plus optional app overrides.

```ts
import { buildTestQpqConfig } from '@qpqjs/testing';

const qpqConfig = buildTestQpqConfig([defineDns('example.com')], { environment: 'production' });
```

## State logic: `askReduceState`

State-driven logic (a reducer plus the story that dispatches into it) is tested by running `askReduceState` through `runStory`: the reducer and the
story are real, the actions they ask for are mocked, and the assertion is on the final state.

```ts
import { runStory } from '@qpqjs/testing';

const state = runStory(askReduceState(createInitialState(), reducer, story), {
  [DateActionType.Now]: '2024-01-01T00:00:00.000Z',
});

expect(state.pending).toEqual([]);
```

## Action processors: `invokeProcessor` and `resolveEventProcessor`

A processor test calls the processor with a payload and inert runtime arguments. `invokeProcessor(processor, payload, overrides?)` supplies a default
test story session, a no-op session updater and a module loader that finds nothing; pass `{ session }`, `{ logger }` and so on when a test needs a
real one. `resolveEventProcessor(resolver, actionType, qpqConfig?)` picks the one processor an event resolver returns for an action type. Mocks belong
at I/O boundaries only (an SDK client, `fs`, `fetch` inside its own wrapper), never on a sibling `@qpqjs` package or a pure helper (T3).

## Pure functions

Reducers, validators, lookups and date math are plain functions: call them and `expect`. Prefer `it.each` for table-driven cases
(`packages/core/src/stories/kvs/utils/isValidKvsAdvancedDataType.test.ts`).

## Keep tests short

A good test is a few lines of mocks, one call, then a block of `expect`s. Shared setup goes into small helpers or a typed builder in `@qpqjs/testing`
once the same shape is cast in three or more files (T4). Timers are faked, never slept (T5).
