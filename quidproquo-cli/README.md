# quidproquo-cli

The `qpq` command line tool: build, dev, and deploy orchestration for [quidproquo](https://github.com/qpqjs/quidproquo) apps.

An app scaffolded with `create-qpq-app` already depends on this and aliases the common commands in its npm scripts, so `npm run dev` and `npm run deploy` are the usual way in. Everything else you call as `qpq` directly.

```bash
npm install --save-dev quidproquo-cli
npx qpq
```

Running `qpq` with no command opens an interactive menu. Every command also takes `--app`, `--env`, and `--platform`.

## Commands

**Local development**

| Command | Does |
| --- | --- |
| `qpq go:dev` | Runs the full local stack, api and web, in one process |
| `qpq go:dev:api` | Just the api dev server, with hot reload |
| `qpq go:dev:web` | Just the views microfrontend dev servers |
| `qpq migrate [app]` | Runs pending migrations against the local dev store once, then exits |

**Deploying**

| Command | Does |
| --- | --- |
| `qpq setup` | Prepares a cloud environment for its first deploy: checks every step (credentials, IAM, hosted zones, bucket names, CDK bootstrap, then the account, domain and bootstrap stacks with the GitHub OIDC provider and deploy role they create), shows what is already in place, and runs the ones you tick in order. Services are deployed afterwards with `qpq go` or `qpq go:docker`. `--check` only reports, `--yes` runs everything, `--only <ids>` a subset |
| `qpq go [svc] [stack]` | Deploys services. Interactive unless you pass the positional args |
| `qpq go:docker` | The same, but deploys in parallel via docker |
| `qpq synth [service]` | Synthesises the configs to `dist/apps/<app>/infrastructure` without deploying |
| `qpq teardown` | Destroys the web, api, and inf stacks for selected services |
| `qpq clear-resources` | Empties selected buckets and tables. Data only, stacks are untouched |

For `go`, `svc` is `all`, a comma-separated list, or one of `account`, `domain`, `bootstrap`. `stack` is `all`, `inf`, `api`, `web`, or `views`. A full `all all` or `all api` deploy also publishes federated backends.

**Federated remotes**

| Command | Does |
| --- | --- |
| `qpq publish` | Build, upload, and deploy federated remotes |
| `qpq publish:build` | Build them locally |
| `qpq publish:upload` | Upload the built version directories. Nothing goes live |
| `qpq publish:deploy` | Flip the manifests to the uploaded versions |

Splitting upload from deploy is what makes a rollback a manifest change rather than a redeploy.

**Workspace**

| Command | Does |
| --- | --- |
| `qpq prep` | Regenerates `apps/<app>/tsconfig.federated.json` |
| `qpq check:circular` | Scans workspace sources for circular imports. `--warn` to report without failing |
| `qpq hooks <name>` | Runs `qpq:<name>` in every app and package that defines it, dependency ordered and in parallel |

## Platforms

The target platform comes from your app's `deploy.config.json`, so the same commands work whichever one an environment uses. AWS and docker are supported today.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
