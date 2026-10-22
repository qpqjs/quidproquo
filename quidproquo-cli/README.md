# quidproquo-cli

The `qpq` command line tool: build, dev, and deploy orchestration for [quidproquo](https://github.com/qpqjs/quidproquo) apps.

An app scaffolded with `create-qpq-app` already depends on this and aliases the common commands in its npm scripts, so `npm run dev` and `npm run deploy` are the usual way in. Everything else you call as `qpq` directly.

```bash
npm install --save-dev quidproquo-cli
npx qpq
```

Running `qpq` with no command opens an interactive menu. Every command also takes `--app` and `--deployment` (an entry in `apps/<app>/deploy.config.json`).

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
| `qpq go:docker` | The same, but deploys in parallel via docker. `--build-only` and `--from-build` split it across machines (see below) |
| `qpq synth [service]` | Synthesises the configs to `dist/apps/<app>/infrastructure` without deploying |
| `qpq teardown` | Destroys the web, api, and inf stacks for selected services |
| `qpq clear-resources` | Empties selected buckets and tables. Data only, stacks are untouched |

For `go`, `svc` is `all`, a comma-separated list, or one of `account`, `domain`, `bootstrap`. `stack` is `all`, `inf`, `api`, `web`, or `views`. A full `all all` or `all api` deploy also publishes federated backends.

**Splitting a docker deploy across machines**

`qpq go:docker` can stop after its build half and resume from the result on another machine, so a CI deploy of a multi-service app can run one job per service and phase while keeping the orders a single `go:docker all all` enforces: every inf stack lands before any api stack, and each api deploy is followed by its federated publish.

| Command | Does |
| --- | --- |
| `qpq go:docker <svc> <stack> --build-only` | Builds the workspace, bundles the api, views and federated remote, synthesises the CDK assembly and writes a manifest. No docker needed. AWS credentials are, since `cdk synth` looks up hosted zones and VPCs |
| `qpq go:docker <svc> <stack> --from-build` | Deploys the chosen stack from that saved build without rebuilding. After `api` it also publishes the federated remote. Needs docker and the same `--deployment`; the workspace does not need to be built |

The build prints the directories that make up each service's saved build: `dist/qpq/go-docker/<app>/<svc>` (the assembly and the manifest), plus `dist/apps/<app>/services/<svc>/views` and `dist/apps/<app>/services/<svc>/service-remote-published` when the service has them. Upload those as the job's artifact. A build made with `all` can deploy any stack. One made with a single stack can only deploy that stack, so a build for `inf` cannot deploy `api` and skip the publish.

The CI shape is a build matrix (`<svc> all --build-only`, one job per service, in parallel), then `<svc> inf --from-build` for every service, then `api` and `web`, then `views`, each job downloading its artifact first. The `qpq:predeploy` hook runs in the build half only. The saved build holds your bundled code and synthesised templates, never credentials; keep the artifact retention short all the same.

`GO_DOCKER_BUILD_CONCURRENCY` caps how many bundles and synths run at once and defaults to the machine's core count. `GO_DOCKER_DEPLOY_CONCURRENCY` caps the deploy containers and defaults to unlimited.

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
| `qpq script:new <dir>` | Writes a user-script template project: `src/main.ts` exporting functions, built into one `main.js` a service loads from a storage drive with `askUserScriptExecute` |
| `qpq script:build <dir> [--out <dir>]` | Bundles a user-script project into `dist/main.js` (or `--out`), npm packages folded in, framework packages external, Node builtins refused. Needs no `npm install` in the project |
| `qpq script:builder-layer --app <app>` | Installs rspack for the app's lambda architecture into the builder layer directory (owned by `quidproquo-user-script`), so a service that registered `defineUserScriptBuilder` can build scripts on lambda. Run it from the app's `qpq:predeploy` hook |
| `qpq check:circular` | Scans workspace sources for circular imports. `--warn` to report without failing |
| `qpq hooks <name>` | Runs `qpq:<name>` in every app and package that defines it, dependency ordered and in parallel |

## User scripts

A user script is a small TypeScript project (`src/main.ts` exporting functions) that a service loads from a storage drive and calls by name with `askUserScriptExecute`. `qpq script:new` writes one and `qpq script:build` bundles it on your machine. To build on the platform instead, a service registers `defineUserScriptBuilder()` from `quidproquo-user-script` and calls `askUserScriptBuild` with the source and output directories on a drive; on the dev server that just works, and on lambda the service also needs the rspack layer: pass `getUserScriptBuilderApiLayer()` in its api layers and have the app's `qpq:predeploy` hook run `qpq script:builder-layer --app <app>`. Both sides use the one directory the package owns, so no path is configured anywhere.

## Platforms

The target platform comes from your app's `deploy.config.json`, so the same commands work whichever one an environment uses. AWS and docker are supported today.

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
