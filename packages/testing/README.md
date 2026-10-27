# quidproquo-testing

Test helpers for [quidproquo](https://github.com/qpqjs/quidproquo) generators.

A qpq story is a generator that yields actions, which means you can test it by stepping through what it yields rather than by standing up infrastructure. This package gives you a fluent way to assert on that sequence, plus matchers that make the failures readable in vitest.

```bash
npm install --save-dev quidproquo-testing
```

`vitest` is a peer dependency.

## `expectGenerator`

Walk a story action by action, supplying the result of each one:

```typescript
import { expectGenerator } from 'quidproquo-testing';

expectGenerator(askGreet('world'))
  .toYield({ type: DateActionType.Now })
  .whenGiven('2026-01-01T00:00:00.000Z')
  .thenReturn('hello world, it is 2026-01-01T00:00:00.000Z');
```

Chain `thenYield` for each subsequent action, and finish with `thenReturn` or, for a void story, `thenComplete`. `whenGiven` also answers to `andReceive` and `withResponse` if one of those reads better at the call site.

This is the right tool when the order of actions is the thing you care about. When you only care about the outcome, `runStory` from `quidproquo-core` is simpler: it takes a map of mocks keyed by action type and hands you the return value.

## vitest matchers

The matchers register globally as a side effect, so they are not exported from the package root. Opt in explicitly:

```typescript
import 'quidproquo-testing/vitest';
```

## Status

Pre-1.0 and under active development. APIs change between releases.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
