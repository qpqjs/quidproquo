---
title: askRandomNumber
description: Get a non-deterministic random number as an action so stories stay pure.
---

# askRandomNumber

Returns a random floating-point number.

- **Action type:** `MathActionType.RandomNumber`
- **At runtime:** resolves to `Math.random()` — a floating-point number in the range `[0, 1)` (0 inclusive, 1 exclusive).

Randomness is the classic source of non-determinism, so a story never calls `Math.random()` inline. It `yield*`s this action and the runtime supplies the value, recording it in the execution log. That keeps the story a pure generator that can be inspected, tested, and replayed — a replay reuses the exact number the original run drew rather than rolling a fresh one.

```typescript
import { askRandomNumber } from '@qpqjs/core';

export function* askRollDice() {
  const r = yield* askRandomNumber();
  // Scale the [0, 1) value into 1..6
  return Math.floor(r * 6) + 1;
}
```

## Signature

```typescript
function* askRandomNumber(): AskResponse<number>;
```

## Parameters

None. There are no bounds arguments — scale or offset the result yourself, as in the example above.

## Returns

`number` — a floating-point value in `[0, 1)`: greater than or equal to `0` and strictly less than `1`.

## Notes

- To get an integer in a range, use the usual arithmetic on the `[0, 1)` value, e.g. `Math.floor(r * (max - min + 1)) + min`.
- The value is not cryptographically secure — it is intended for general-purpose randomness (sampling, jitter, dice), not for keys or tokens.

## Related

- [askGuidNew](../guid/ask-new-guid.md) — for a unique identifier rather than a raw random number.
