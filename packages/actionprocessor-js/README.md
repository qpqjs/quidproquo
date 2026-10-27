# quidproquo-actionprocessor-js

The platform-free half of the [quidproquo](https://github.com/qpqjs/quidproquo) runtime.

A qpq story yields actions, and a **processor** is the function that actually carries one out. The processors in this package need nothing but a JavaScript engine, so they are shared by every other runtime: Node, the browser, and AWS Lambda all start from this set and add their own on top.

You do not usually install this yourself. It arrives as a dependency of `quidproquo-actionprocessor-node`, `-web`, or `-awslambda`.

## What it implements

`config`, `context`, `date`, `error`, `guid`, `log`, `math`, `metric`, `network`, `platform`, `system`, and custom actions, plus the dns processors from the web server layer.

These are the actions with no meaningful platform difference. `askDateNow` reads the same clock everywhere, `askNewGuid` generates the same kind of id, and `askNetworkRequest` uses `fetch`. Anything that does differ (storage, queues, user directories) is left to the platform packages.

## Why it is separate

Splitting the platform-free processors out means a new runtime only has to implement what is genuinely new about it, and it keeps the shared behaviour in one place so Lambda and the dev server cannot drift apart on things like error shapes or logging.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
