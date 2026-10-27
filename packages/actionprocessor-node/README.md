# quidproquo-actionprocessor-node

The Node.js runtime for [quidproquo](https://github.com/qpqjs/quidproquo).

A qpq story yields actions, and a **processor** is the function that actually carries one out. This package supplies the processors that need Node: streams, dynamic function loading, and inline function execution. It builds on `quidproquo-actionprocessor-js`, which covers everything that works on any JavaScript engine.

You do not usually install this yourself. It arrives as a dependency of `quidproquo-dev-server`, `quidproquo-actionprocessor-awslambda`, and the CLI.

## What is in here

- **Node processors** for stream, dynamic function, and inline function actions
- **`traceStoryExecution`**, which replays a story under the Node inspector to produce a statement-by-statement execution trace with local values. This is what the admin console renders as an annotated source view
- **Dynamic action processors**, for resolving processor sets at runtime rather than at build time
- **Test helpers** for driving stories against real Node behaviour

## Where it runs

Anywhere Node runs: the dev server, a container, a script, or as the base layer under the AWS Lambda processors.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
