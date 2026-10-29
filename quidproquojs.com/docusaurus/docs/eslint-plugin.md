---
sidebar_position: 5
---

# ESLint Plugin

The `ask` prefix is a contract: [every function that starts with `ask` is a story](./core-concepts.md#why-every-function-starts-with-ask), and every story must be run with `yield*`. Contracts are only useful if something enforces them, so quidproquo ships an ESLint plugin that does. It catches the two mistakes everyone makes at least once:

```typescript
// error: creates a generator that never runs
const now = askDateNow();

// error: hands the generator to the runtime as a value instead of running it
const now = yield askDateNow();

// correct
const now = yield* askDateNow();
```

## Setup

If you use the shared config, you already have it. `@qpqjs/eslint-config` wires the plugin in, so every `create-qpq-app` project and every package extending that config gets both rules as errors with no extra setup.

To use the plugin on its own, without the rest of the shared config:

```js title="eslint.config.mjs"
import { qpqPlugin } from '@qpqjs/eslint-config';

export default [
  qpqPlugin.configs.recommended,
  // or pick rules individually:
  // { plugins: { qpq: qpqPlugin }, rules: { 'qpq/require-yield-star': 'error' } },
];
```

## `qpq/require-yield-star`

Inside a generator, any call to an `ask*` function (including member calls like `authLogic.askLogin()` and tagged templates like `` askLog`...` ``) must be delegated with `yield*`.

The rule is auto-fixable. Run `eslint --fix` and it will:

- insert `yield*` in front of a bare call
- upgrade a plain `yield` to `yield*`
- replace a wrong `await` with `yield*`
- add parentheses where a bare yield expression is not allowed, for example `!askUserExists(id)` becomes `!(yield* askUserExists(id))`

Two patterns stay legal, because they are how stories are meant to be composed and tested:

```typescript
// ask calls as arguments build generators for the outer ask to run
yield* askRunParallel([askMathRandomNumber(), askDateNow()]);

// outside a generator you cannot yield; tests and forwarding
// wrappers create generators and hand them off
const result = runStory(askDateNow(), mocks);
```

## `qpq/ask-prefix-generator-only`

The reverse direction: `ask` is reserved for stories, the same way `use` is reserved for React hooks. A plain function named `ask*` breaks the contract, because callers will `yield*` something that is not a generator.

```typescript
// error: not a generator
function askUserName() {
  return 'joe';
}

// correct
function* askUserName(): AskResponse<string> {
  return yield* askConfigGetParameter('user-name');
}
```

The rule checks every kind of function literal: declarations, arrows, object methods, class methods and class properties. Aliases and factory results are fine, since the right-hand side already is (or produces) a story:

```typescript
// both legal: not function literals
const askLog = askLogTemplateLiteral;
const askActiveTenantRead = createContextReader(tenantContext);
```

There is no auto-fix for this one. Whether the function should become a generator or lose the prefix is a judgement call.

## Why bother

TypeScript alone cannot catch a missing `yield*`. Calling `askDateNow()` without yielding is perfectly well-typed, it just returns a generator that nobody ever runs, and the action inside it silently never happens. That failure mode produces no error, no log line, and no clue. A lint rule at edit time is the cheapest place to catch it.
