# @qpqjs/tsconfig

The shared TypeScript configuration used by every package in the [quidproquo](https://github.com/qpqjs/quidproquo) monorepo.

It exists so the framework packages compile the same way, and so an app can start from settings that are known to work with qpq's generator-heavy code and dual CommonJS and ESM builds.

```bash
npm install --save-dev @qpqjs/tsconfig
```

```json
{
  "extends": "@qpqjs/tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./lib"
  },
  "include": ["src"]
}
```

Packages that ship both module formats extend `tsconfig.commonjs.json` and `tsconfig.esm.json` instead, one per output. Those two set `module` and, relative to the extending package, `outDir` (`lib/commonjs` or `lib/esm`), `include` (`src`) and the `exclude` list that keeps tests, `__fixtures__` and `testing` folders out of the build, so a package file is usually just the `extends` line. A package that needs more excluded restates the whole list, because `exclude` replaces rather than merges.

An app scaffolded with `create-qpq-app` is already set up this way, so there is nothing to configure.

## Status

Pre-1.0 and under active development. Settings change between releases.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
