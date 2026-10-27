# quidproquo-tsconfig

The shared TypeScript configuration used by every package in the [quidproquo](https://github.com/qpqjs/quidproquo) monorepo.

It exists so the framework packages compile the same way, and so an app can start from settings that are known to work with qpq's generator-heavy code and dual CommonJS and ESM builds.

```bash
npm install --save-dev quidproquo-tsconfig
```

```json
{
  "extends": "quidproquo-tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./lib"
  },
  "include": ["src"]
}
```

Packages that ship both module formats extend this from two files, one per output, and set `module` and `outDir` accordingly.

An app scaffolded with `create-qpq-app` is already set up this way, so there is nothing to configure.

## Status

Pre-1.0 and under active development. Settings change between releases.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
