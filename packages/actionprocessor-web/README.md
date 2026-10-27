# quidproquo-actionprocessor-web

The browser runtime for [quidproquo](https://github.com/qpqjs/quidproquo).

A qpq story yields actions, and a **processor** is the function that actually carries one out. This package supplies the processors a story needs when it runs in the browser, so the same story code can run on the client and the server.

You do not usually install this yourself. It arrives as a dependency of `quidproquo-web-react`.

## What it implements

- **Web actions**: window and location access, query parameter reads and writes
- **Api actions**: calling your qpq service apis from the client, with the same typed requesters the backend uses
- **Config**: reading client-side config values

Everything platform-neutral (dates, guids, http, logging) comes from `quidproquo-actionprocessor-js`.

## The point of it

A frontend story and a backend story are the same kind of thing. Shared validation, shared calculations, and shared workflow logic can live in one place and run on whichever side needs them, because both sides resolve their actions through a runtime rather than calling APIs directly.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
