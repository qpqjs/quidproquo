# Testing Standard

Tests run on [Vitest](https://vitest.dev): `npm run test` (watch: `npm run test:watch`).
Each test file sits next to the source it covers as `<name>.test.ts`.

QPQ business logic is written as **stories** — generator functions that `yield*` actions and
receive their results back. There are two complementary ways to test them.

## 1. Story-level tests with `runStory` (the default)

`runStory` (from `quidproquo-core`) runs a story to completion, answering every action it
asks for from a mock map. It is built on `askOverrideActions`, so batches (`askRunParallel`),
nested stories, and `askCatch` all work transparently. This is the pattern to reach for when a
story composes several actions.

```ts
import { runStory, throwsError, expectError } from 'quidproquo-core';

const result = runStory(askKeyValueStoreQueryAll('items', keyCondition), {
  // a literal value…
  [KeyValueStoreActionType.Query]: { items: ['a', 'b'] },
  // …or a function of the action (also doubles as a spy)
  [DateActionType.Now]: (action) => '2024-01-01T00:00:00.000Z',
});

expect(result).toEqual(['a', 'b']);
```

Rules of thumb:

- **A mock is the raw success value.** `askCatch`/`returnErrors` wrapping is applied for you, so
  the same mock works whether or not the story wraps the action in `askCatch`.
- **Simulate failures** with `throwsError(errorType, errorText)`. Under `askCatch` it comes back
  as a failed `EitherActionResult`; otherwise it propagates as a thrown `StoryError`.
- **Every action must be mocked.** Anything that reaches the runtime throws a descriptive error,
  so tests can never silently pass against an un-stubbed dependency.
- **Narrow `EitherActionResult`s** with `expectSuccess(result)` / `expectError(result)` instead of
  hand-written `if (result.success)` guards.
- **Assert on requests** by using the function form of a mock (or a `vi.fn`) and checking the
  action it received.

See `packages/core/src/testing/storyTesting.test.ts` for the full surface and
`packages/core/src/stories/askRetry.test.ts` for a representative composed-story test.

## 2. Action-requester tests with `expectGenerator`

For a single action requester, `expectGenerator` (from `quidproquo-testing`) asserts the exact
action that is yielded and the value fed back — no runtime needed.

```ts
import { expectGenerator } from 'quidproquo-testing';

expectGenerator(askConfigGetSecret('my-secret'))
  .toYield({ type: ConfigActionType.GetSecret, payload: { secretName: 'my-secret' } })
  .whenGiven('resolved-value')
  .thenReturn('resolved-value');
```

## 3. Pure functions

Reducers, validators, lookups, and date math are plain functions — test them directly with
`expect`. Prefer `it.each` for table-driven cases (see
`packages/core/src/stories/kvs/utils/isValidKvsAdvancedDataType.test.ts`).

## Keep tests clean

A good test is a few lines of mocks, one invocation, then a block of `expect`s. Push shared
setup and repeated assertions into small helpers (`runStory`, `expectError`, fixtures) rather
than repeating them — the test should read as *what* is being verified, not *how* the runtime
is driven.
