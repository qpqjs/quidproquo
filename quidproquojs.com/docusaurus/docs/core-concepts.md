---
sidebar_position: 2
---

# Core Concepts

Quidproquo follows a Redux-like action/processor pattern where business logic is expressed as generator functions ("stories") that yield actions, which are then processed by platform-specific implementations.

## Actions

Type-safe Redux-style actions with a type and optional payload.

## Stories

Generator functions that compose business logic by yielding actions and receiving results.

## Action Processors

Platform-specific implementations that execute actions.

## Runtime

The orchestration layer that executes stories by processing yielded actions through the appropriate processors.

## Why every function starts with `ask`

Every quidproquo function you call from a story starts with `ask`: `askDateNow`, `askFileReadTextContents`, `askRunParallel`. That prefix isn't decoration, it tells you exactly what kind of function you're holding. Here's the whole of `askDateNow`:

```typescript
export function* askDateNow(): DateNowActionRequester {
  return yield { type: DateActionType.Now };
}
```

Notice it never calls `new Date()`. It yields a plain action object and suspends. The runtime catches that action, hands it to the platform's `DateNow` processor (which actually reads the clock), then resumes the generator with the result. The `ask` prefix captures three things about that arrangement:

### 1. It's a request, not an execution

Calling `askDateNow()` does nothing on its own. It builds a generator that *describes* what it wants, and the runtime decides how to fulfil it. That's what keeps stories pure and platform-agnostic: the "what" lives in your story, the "how" lives in the `@qpqjs/actionprocessor-*` packages. Your story doesn't know whether the clock is a Lambda, a Node process, or a test fixture.

### 2. It's a question with an answer

The return type is literally `AskResponse<T>`. You ask, the runtime responds, and the response arrives as the generator's return value:

```typescript
const now = yield* askDateNow(); // now: QpqIsoDateTime
```

Every action pairs a **requester** (the `ask` function your story calls) with a **processor** (the platform implementation that produces the answer). They're two halves of the same conversation.

### 3. It signals the calling convention

Anything starting with `ask` must be invoked with `yield*` from inside another generator. The prefix works like a syntax marker, the same way `use` marks a React hook: see `ask`, write `yield*`. Higher-level stories that compose other ask functions follow the same rule and get the same prefix (`askGetCurrentEpochMs`, `askRunParallel`, `askCatch`).

The practical payoff is testability and portability. Because `askDateNow` only describes intent, a test can run the same story with a fake processor that returns a fixed timestamp, and the identical story code runs on Lambda, Node, or the browser just by swapping the processor set.

Both halves of this contract (always `yield*` an ask call, never name a plain function `ask*`) are enforced at edit time by the [quidproquo ESLint plugin](./eslint-plugin.md), which ships with the shared lint config and auto-fixes missing `yield*`s.