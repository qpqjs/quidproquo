# quidproquo-eslint-config

The shared ESLint configuration for [quidproquo](https://github.com/qpqjs/quidproquo) projects, bundled with a small plugin that enforces the framework's `ask` naming contract.

```bash
npm install --save-dev quidproquo-eslint-config
```

```js
// eslint.config.mjs
import qpqConfig from 'quidproquo-eslint-config';

export default [...qpqConfig];
```

`eslint` and `prettier` are peer dependencies. Beyond the qpq rules below, the config sets the house style, including import sorting that groups quidproquo packages separately from external dependencies.

## qpq rules

The shared config bundles a small ESLint plugin (`plugin/index.mjs`, namespace `qpq`)
that enforces the framework's `ask` naming contract.

Using the shared config gets you the rules automatically. To use the plugin on its own,
without the rest of the config:

```js
// eslint.config.mjs
import { qpqPlugin } from 'quidproquo-eslint-config';

export default [
  qpqPlugin.configs.recommended,
  // or pick rules individually:
  // { plugins: { qpq: qpqPlugin }, rules: { 'qpq/require-yield-star': 'error' } },
];
```

The rules:

### `qpq/require-yield-star`

Inside a generator, a call to any `ask*` function (including `obj.askX()`) must be
delegated with `yield*`. A bare call or a plain `yield` creates a generator that never
runs. Auto-fixable: the fix inserts `yield*` (adding parentheses where a bare yield
expression is not allowed), upgrades `yield` to `yield*`, and replaces a wrong `await`.

```ts
const now = askDateNow();        // error, fixed to: yield* askDateNow()
const now = yield askDateNow();  // error, fixed to: yield* askDateNow()
const now = yield* askDateNow(); // correct
```

Allowed without `yield*`:

- ask calls passed as arguments, that's how stories compose:
  `yield* askRunParallel([askA(), askB()])`, `runStory(askDateNow(), mocks)`
- ask calls outside generator functions (test drivers, forwarding wrappers), since
  yielding is not possible there anyway

### `qpq/ask-prefix-generator-only`

The `ask` prefix is reserved for qpq stories, the same way `use` is reserved for React
hooks. Any function literal named `ask*` (declaration, arrow, method, class property)
must be a generator. Aliases and factory results like
`const askRead = createContextReader(ctx)` are fine because they are not function
literals. Not auto-fixable, rename the function or make it a generator.

Tests live next to the rules (`plugin/rules/*.test.mjs`) and run with the repo's
vitest suite: `npx vitest run --project quidproquo-eslint-config`.

## Status

Pre-1.0 and under active development. Rules and settings change between releases.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
