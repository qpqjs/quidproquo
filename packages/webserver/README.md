# quidproquo-webserver

The web layer of [quidproquo](https://github.com/qpqjs/quidproquo). It adds everything a service needs to be reachable over the network: routes, apis, websockets, dns, email, and the config settings that describe them.

Most applications should install [`quidproquo`](https://www.npmjs.com/package/quidproquo), which re-exports this package together with `quidproquo-core`.

```bash
npm install quidproquo-webserver
```

## What it adds

**Actions** for the things a web service does, on top of the core catalogue:

| Domain | Covers |
| --- | --- |
| `api` | Calling another service's api |
| `webEntry` | Serving a website or single page app |
| `websocket` | Sending messages to connected clients |
| `email` | Sending mail |
| `dns` | Record lookups and management |
| `serviceFunction` | Invoking a function on another service |
| `routeAuthValidation`, `apiKeyValidation` | Auth and api key checks in front of a route |
| `genericDataResource`, `admin` | Data resources and the admin surface |

**Config settings** in `src/config/settings/`, the `define*` helpers you compose into a service config: `defineRoute`, `defineApi`, `defineWebEntry`, `defineWebsocket`, `defineDns`, `defineCertificate`, `defineEmailSender`, `defineApiKey`, `defineCache`, `defineSeo`, `defineSeed`, `defineMigration`, `defineDomainProxy`, `defineSubdomainRedirect`, `defineServiceFunction`, and the auth system helpers.

A service config is a plain array. The deploy packages read it to build infrastructure, and the dev server reads the same array to run the service locally.

**`qpqWebServerUtils`**, the helpers you use inside route stories, for example `toJsonEventResponse` for turning a value into an `HTTPEventResponse`.

## Where the platform bits live

This package stays platform-neutral. Anything that is specific to one cloud lives in the layer that owns it: `quidproquo-config-aws` for AWS-only settings, and the `quidproquo-actionprocessor-*` packages for the implementations that run these actions.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
