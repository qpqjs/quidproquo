# quidproquo-web

Browser-side building blocks for [quidproquo](https://github.com/qpqjs/quidproquo), with no UI framework attached.

If you are writing a React app, install [`quidproquo-web-react`](https://www.npmjs.com/package/quidproquo-web-react) instead. It depends on this package and adds the hooks, state store, and providers.

```bash
npm install quidproquo-web
```

## What is in here

- **Web actions**: reading and writing query parameters, and window access, expressed as qpq actions so a story can use them
- **`WebsocketService`**: a managed websocket connection with reconnect handling
- **Federation helpers**: forcing a federated remote to reload, which is what makes a deploy visible to an already-open tab
- **Small utilities** shared across qpq frontends, such as `timeAgo` and `uniqueBy`

## Why the actions

Query parameters and window state are side effects like any other. Going through an action keeps the story that uses them testable and lets the same logic run server-side, where a processor answers with something else.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
