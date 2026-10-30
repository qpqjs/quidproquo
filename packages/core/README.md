# @qpqjs/core

The heart of the [quidproquo](https://github.com/qpqjs/quidproquo) framework: the action catalogue, the story runtime, and the config system that everything else builds on.

Most applications should install [`quidproquo`](https://www.npmjs.com/package/quidproquo) instead, which re-exports this package along with `@qpqjs/webserver`. Install this one directly only if you want core without the web server.

```bash
npm install @qpqjs/core
```

## How it works

An **action** is a plain object with a type and an optional payload. A **requester** is the `ask*` generator your code calls to yield one. Here is the whole of `askDateNow`:

```typescript
export function* askDateNow(): DateNowActionRequester {
  return yield { type: DateActionType.Now };
}
```

It never calls `new Date()`. A **story** composes requesters:

```typescript
function* askGreet(name: string): AskResponse<string> {
  const now = yield* askDateNow();
  return `hello ${name}, it is ${now}`;
}
```

The **runtime** drives the story, takes each yielded action, looks up the **processor** registered for that action type, awaits the result, and resumes the generator with it. Processors live in the `@qpqjs/actionprocessor-*` packages, one set per platform. Swap the set and the same story runs somewhere else.

Every action that passes through the runtime is recorded, which is where the execution logs, replay, and tracing come from.

## What is in here

**Actions**, grouped by domain in `src/actions/`:

| Domain | Covers |
| --- | --- |
| `config` | Parameters, secrets, globals |
| `keyValueStore` | Key value storage, queries, and streams |
| `file` | Object storage: read, write, list, signed urls |
| `userDirectory` | Sign in, sign up, tokens, user management |
| `eventBus`, `queue` | Publish and subscribe, message queues |
| `network` | HTTP requests |
| `graphDatabase` | Graph queries |
| `ai` | Prompting and streaming completions |
| `crypto` | Encrypt and decrypt against a managed key |
| `date`, `guid`, `math` | The non-deterministic primitives a story must not call directly |
| `log`, `metric`, `event` | Observability |
| `state` | Reducer-driven state for frontend modules |
| `stream`, `system`, `platform` | Streams, process, and platform utilities |
| `dynamicFunctions`, `inlineFunction` | Calling code that is resolved at runtime |
| `error`, `context` | Error handling and execution context |

**Stories** in `src/stories/`: the composable helpers, including `askCatch` for try/finally semantics and `askRunParallel` for concurrency.

**Config** in `src/config/`: the `define*` helpers that declare resources (key value stores, queues, secrets, and so on). A qpq config is a plain array of settings, which is what the deploy packages read to build infrastructure.

**Testing** in `src/testing/`: `runStory` runs a story with actions mocked by type, so you can assert on behaviour without a runtime or any infrastructure.

```typescript
import { DateActionType, runStory } from '@qpqjs/core';

const result = runStory(askGreet('world'), {
  [DateActionType.Now]: '2026-01-01T00:00:00.000Z',
});

expect(result).toBe('hello world, it is 2026-01-01T00:00:00.000Z');
```

A mock can be a literal value or a function, and a function mock is re-invoked per matching action, so it can be stateful.

## Conventions worth knowing

- Anything named `ask*` is a generator and must be called with `yield*`. The [ESLint plugin](https://github.com/qpqjs/quidproquo/tree/main/packages/eslint-config) enforces this and auto-fixes a missing `yield*`.
- Stories must be deterministic. No `Date.now()`, `Math.random()`, or `crypto.randomUUID()`. Yield `askDateNow()` or `askGuidNew()` so logs replay and tests stay stable.
- Throw with `return yield* askThrowError(...)`, which tells TypeScript that control stops there.

## Status

Pre-1.0. The whole `@qpqjs/*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
