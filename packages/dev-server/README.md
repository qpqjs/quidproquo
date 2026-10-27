# quidproquo-dev-server

Runs a whole [quidproquo](https://github.com/qpqjs/quidproquo) app on your machine.

It reads the same service configs the deploy packages read, stands up every route, websocket, queue, scheduled event and data store the app declares, and executes your stories through the real qpq runtime. Nothing is stubbed out or simplified.

```bash
npm install quidproquo-dev-server
```

You normally reach it through the `qpq` CLI or, in a scaffolded app, `npm run dev`.

## Why it works the way it does

The point of the dev server is that local behaviour matches deployed behaviour. It uses the same core code paths, the same serialization round-trips, and synthetic execution deadlines so a story that would time out in the cloud times out here too. When something needs a shortcut to work locally, that is treated as a bug in the dev server rather than an accepted difference.

## Where local data lives

Key value store data lives in one sqlite database at `<runtimePath>/kvs/kvs.db`, where `runtimePath` defaults to `.qpq-runtime`. One table per store (`qpq_kvs_<ownerModule>_<storeName>`), with a `scope` column for tenant partitions and the raw item JSON in `data`. Writes commit straight to disk, so there is no flush window and every service sees current data.

To inspect it, use anything that speaks sqlite: `sqlite3 .qpq-runtime/kvs/kvs.db`, TablePlus, DB Browser, or the VS Code sqlite extension. The db is safe to read while the server runs (WAL mode); stop the server before writing to it by hand.

The engine is Node's built-in `node:sqlite`, which needs Node 22.13 or newer (no flag from 22.13, no experimental warning from 24). Leftover `kvs/**/*.json` files from the previous json engine are not read or migrated; the server prints a one-time note and you can delete them.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
