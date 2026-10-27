# quidproquo-neo4j

Neo4j behind the graph database actions in [quidproquo](https://github.com/qpqjs/quidproquo).

Core defines `graphDatabase` actions in platform-neutral terms. This package supplies the processors that answer them with Neo4j, so a story written against `askGraphDatabase*` runs unchanged whether the graph is Neo4j here or Neptune on AWS.

```bash
npm install quidproquo-neo4j
```

## What is in here

- **Processors** that override the graph database actions with a Neo4j implementation
- **Config settings** for declaring the connection
- **Scheduled event entries** for the background work a graph deployment needs

## Adding it to a service

Add the config setting to your service config and register the processor override in the runtime your service uses. Everything above that, the stories and the queries, stays the same.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
