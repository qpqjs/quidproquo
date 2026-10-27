# quidproquo-features

Ready-made features for [quidproquo](https://github.com/qpqjs/quidproquo) apps. Each one is a config helper plus the stories, routes, and frontend state that go with it, so you add a feature by putting a `define*` in your service config rather than by writing it.

```bash
npm install quidproquo-features
```

Requires `quidproquo-core` and `quidproquo-webserver` (or `quidproquo`).

## What is in here

| Feature | What you get |
| --- | --- |
| `admin` | The backend for the admin console: log search, trace replay, config inspection, maintenance |
| `eventDoc` | Event-sourced documents. State is a fold over an append-only event log, with a shared workspace layer on top |
| `eventDocAi` | AI-assisted editing of an event document |
| `eventDocTransfer` | Moving event documents between owners |
| `systemUsers` | Machine-to-machine users and their credentials |
| `tenant` | Multi-tenancy: tenant scoping, membership, and branding |
| `validation` | Shared request and payload validation |
| `webSocketQueue` | Reliable, ordered websocket messaging between server and client |
| `routes` | Route helpers, including `dynamicRoute` for declaring a route next to its story |

## How a feature is put together

Features follow the same layout as any qpq state module: `types/`, `models/`, `effects/`, `actionCreators/`, `stateUpdaters/`, `logic/`, `selectors/`, and `constants/`, one concern per folder and one exported thing per file. That means you can read a feature top to bottom, and you can borrow the shape when you build your own.

The backend halves are ordinary qpq config, so a feature deploys through the same pipeline as the rest of your app with no special casing.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
