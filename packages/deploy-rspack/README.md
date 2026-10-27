# quidproquo-deploy-rspack

Rspack build configuration for [quidproquo](https://github.com/qpqjs/quidproquo) services.

It produces the bundles a qpq app deploys: the handler bundles that run on the platform, the `quidproquo-dynamic-loader` virtual module that lets a function resolve its business logic at runtime, and module federation remotes for frontends and dynamically loaded backend code.

```bash
npm install quidproquo-deploy-rspack
```

`@rspack/core` is a peer dependency. You normally drive this through the [`qpq` CLI](https://www.npmjs.com/package/quidproquo-cli) rather than calling it directly.

## What it handles

- **Externals**, worked out from the service config so platform-provided modules are not bundled
- **Loaders and plugins** for the qpq build, including the virtual dynamic loader module
- **Federation**, both host and remote sides, so a service can publish its logic and another can load it at runtime

## webpack or rspack

[`quidproquo-deploy-webpack`](https://www.npmjs.com/package/quidproquo-deploy-webpack) is the same API surface on webpack. Pick one. Rspack is faster and is what the scaffolded app and the CLI use by default; webpack is kept for projects that need it or that depend on a webpack-only plugin.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
