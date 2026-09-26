# quidproquo-cli — the invisible harness

Design agreed 2026-07-09, from a review of `~/repo/antero-software/doccypoccy` (the
reference QPQ consumer app). Goal: a consumer repo owns only its apps and a handful
of boring root files; everything else ships as published quidproquo packages, and
"updating the harness" means bumping npm versions — no copy-down, no file merging.

## Problem statement

Today a QPQ app (doccypoccy) carries a large `tools/` directory (deploy/synth/publish
scripts, rspack config builders, a dev-server shell, the CDK app entry) plus root npm
scripts that run it all via ts-node. Updating the harness means hand-merging those
files. Worse, the coupling leaks both ways:

- Every service's `rspack.config.ts` imports the harness by relative path
  (`../../../../../tools/rspack`).
- App-specific build cruft has leaked *into* the "generic" tools: a liquidjs warning
  filter and adm-zip/ws IgnorePlugins live in `tools/rspack/serviceRspackShared.ts`
  only because doccypoccy uses those packages.

The original idea of a copy-down harness ("delete everything except `apps/`, copy the
new harness around it") is **dropped** in favour of an invisible, CRA-style harness.

## The consumer repo, after

```
<repo>/
  apps/                     ← required convention; all else is user's choice
    <app>/
      package.json          ← NEW: thin, app-owned lifecycle hooks (e.g. chakra:typegen)
      deploy.config.json    ← KEPT as JSON; extended (see Deploy identity)
      account.qpq.ts        ← NEW: moved from tools, per app
      bootstrap.qpq.ts      ← NEW: moved from tools, per app
      tsconfig.federated.json
      services/<svc>/{config,models,x-models,shared-logic,x-logic,service-utils,service,views}
      packages/*            ← app-scoped shared packages
  packages/                 ← repo-wide shared libs (e.g. exengne); plain workspaces
  package.json              ← user-owned: hoisted deps, workspaces globs, thin scripts
  tsconfig.base.json        ← one-liner extending quidproquo-tsconfig
  eslint.config.mjs         ← one-liner re-exporting quidproquo-eslint-config
  types/assets.d.ts
```

No wrapper folder around `apps/` + `packages/` — with the harness invisible there is
nothing to delete around them, so the repo is laid out however the user likes as long
as `apps/` exists.

**Dependency hoisting stays.** All app runtime deps live in the root package.json on
purpose: one place to update versions across all apps, and module federation requires
shared singletons (react etc.) to agree across every independently built bundle.
Root package.json is entirely user-owned; qpq's only claims on it are a
`quidproquo-cli` devDep, the workspaces globs, and thin alias scripts.

## quidproquo-cli (the `qpq` CLI)

- Published from the quidproquo monorepo. Declares `"bin": { "qpq": ... }` — bin
  names are not registry-namespaced, so the taken `qpq` npm package name doesn't
  matter. npm scripts resolve `node_modules/.bin/qpq` locally.
- **CLI only**: command parsing, app/service discovery (`apps/*/services/*`),
  orchestration, interactive prompts. All real logic pushes down into the packages it
  calls:
  - rspack service/views config builders, federated exports → `quidproquo-deploy-rspack`
  - dev-server shell + dynamicModuleLoader glue → `quidproquo-dev-server`
  - CDK app entry + cdk.json → `quidproquo-deploy-awscdk` (CDK is identical for all
    products; nothing CDK-shaped lives in the consumer repo)
- **Fat CLI**: hard-depends on deploy-rspack, deploy-awscdk, dev-server, etc. One
  install, no plugin discovery. It's dev tooling; weight is fine.
- **Zero package-specific knowledge**: no liquidjs/adm-zip/ws special cases baked in.
  That cruft moves to the consumer's own config (see bundle options below). Hard
  line — otherwise the ignore list grows forever with every consumer's pet dependency.
- Command names keep the muscle memory: `qpq go`, `qpq go:dev`, `qpq go:dev:api`, `qpq go:dev:web`,
  `qpq synth`, `qpq prep`, `qpq publish[:build|:upload|:deploy]`, `qpq go:docker`.
  Root package.json keeps aliases like `"go": "qpq go"`.

## Per-service boilerplate → gone

Services lose `rspack.config.ts` entirely (the CLI bundles from QPQ config +
convention; today's file is a 3-line shim anyway). What remains per workspace
package is the npm-required minimum: a name-only `package.json` and a ~3-line
`tsconfig.json` stub extending quidproquo-tsconfig (kept for editor experience —
go-to-def and squiggles need real tsconfig files on disk).

## New config settings

### Layers provide modules (externals derived, not configured)

The lambda layer declaration grows a `modules` field:

```ts
{ name: 'chromium-149', buildPath: '../layers/chromium-...zip', modules: ['@sparticuz/chromium'] }
```

Meaning: "this layer provides these packages at runtime." The AWS bundler derives
externals from it; the dev server ignores it (locally the package resolves from
node_modules and just runs). Externalization stops being bundler config and becomes
a consequence of environment-provided modules — only applied on AWS builds, which is
the goal.

> **Found bug/todo**: doccypoccy's pdf service *says* (in a comment) it externalizes
> `@sparticuz/chromium`, but nothing anywhere does — the only externals rule in the
> whole stack is `externals: [/aws-sdk/]` in `quidproquo-deploy-rspack`. It is being
> bundled today. The `modules` field fixes this properly.

### defineBackendBundleOptions — skinny, rarely used

Home for dependency-specific build declarations that aren't layer-related:
`ignoreModules` (adm-zip's `original-fs`, ws's `bufferutil`/`utf-8-validate`),
`ignoreWarnings` (liquidjs source-map noise), and an `externals` escape hatch for
non-layer cases. Lives in **quidproquo-core** — "these modules behave oddly at
build time / are provided by the environment" is platform-neutral metadata even
though layers are the AWS mechanism.

### defineFrontendBundleOptions — ships nearly empty

Fonts/images are already default-on in the views build. Grow on demand (extra asset
extensions, extra MF shared packages, html tweaks). Don't add speculative options.

### defineDevServerOptions({ views, webEntries }) — exported from quidproquo-dev-server

`views: { port }` replaces the `"port": 3069` smuggled into views package.json.
`webEntries: { <name>: { port } }` gives a web entry (docs and the like) a port
of its own, which the docker image listens on. Every other web entry is served on
the api port by its domain: the root-domain entry at `/`, a subdomain entry at
`/<subdomain>` (so the federated views land at `/views`). No service or entry
names are assumed. The package that consumes
the setting exports it, same pattern as AWS-only settings living in
quidproquo-config-aws. No `defineDevServerBundleOptions` for now — the dev server
runs from source with real node_modules, so bundling concerns dissolve there by
construction; add it only when a genuine dev-only build tweak appears.

All new enums follow the house style: TS `enum` with camelCase members.

## Per-app configuration

- **`deploy.config.json` stays JSON** (machine-readable before any TS executes —
  discovery, prompts, credential checks) and is **the source of truth for every
  deployment**: `{ "deployments": { "<name>": { platform, name, environment,
  feature?, platformSettings, settings? } } }`. `qpq go --deployment production`
  needs no identity env vars; the CLI primes APPLICATION_NAME / ENVIRONMENT /
  FEATURE_NAME / DEPLOY_SETTING_* (and the platform's own, AWS_DEFAULT_* for aws)
  from the entry, unconditionally. A feature deployment is an entry with
  `feature` set, not a shell variable. Settings are strings handed to
  infrastructure.ts via `getDeploySetting`; the file holds identity only, never
  credentials. The domain stays in code (defineDns).
- **`account.qpq.ts` / `bootstrap.qpq.ts` move from tools into each app**,
  parameterized by the values in deploy.config.json. One bootstrap/account config
  per app; bootstrap already namespaces deployed resources by app name, so multiple
  apps sharing an AWS account coexist.
- **Lifecycle hooks**: `apps/<app>/package.json` carries app-owned scripts with a
  `qpq:` prefix convention (`qpq:postinstall`, `qpq:prebuild`, ...) which the CLI
  invokes when present. chakra:typegen moves out of the root postinstall into
  docgen's own `qpq:postinstall`.

## Migration: slim doccypoccy into the lean reference project

Scaffolding (`qpq create app|service`, `npm create quidproquo`) and `qpq upgrade`
are day-two. Day one is making doccypoccy lean:

1. Add `modules` to the layer declaration type; derive externals in the AWS bundle
   path; declare `@sparticuz/chromium` on the chromium layer (fixes the found bug).
2. Add `defineBackendBundleOptions` / `defineFrontendBundleOptions` (core) and
   `defineDevServerOptions` (quidproquo-dev-server).
3. Move `tools/rspack` builders into `quidproquo-deploy-rspack`; strip the
   doccypoccy-specific ignore cruft and re-declare it via
   `defineBackendBundleOptions` in the relevant doccypoccy services.
4. Move `tools/dev-server` into `quidproquo-dev-server`; port config comes from
   `defineDevServerOptions`, delete `"port"` from views package.jsons.
5. Move the CDK entry + cdk.json into `quidproquo-deploy-awscdk`.
6. Create `quidproquo-cli`: port `tools/services-deployment-awscdk/scripts/*`
   as `qpq` commands, calling down into the packages above.
7. Move account/bootstrap configs per-app; extend deploy.config.json with the
   env → account/region map; switch scripts off raw env vars.
8. Give each app a package.json; move chakra:typegen to docgen's `qpq:postinstall`.
9. Delete per-service `rspack.config.ts`; slim per-package tsconfigs to stubs.
10. Root package.json: thin `"go": "qpq go"`-style aliases; drop tools/ and the
    devDeps that only existed for it; delete `tools/`.

## Implementation notes (landed 2026-07-09)

Everything above is implemented except the scaffolder. Details decided during
implementation:

- **quidproquo-cli** ships `bin/qpq.js` (dispatch: go, go:docker, go:dev,
  go:dev:api, go:dev:web, synth, prep, publish[:build|:upload|:deploy], hooks) and
  `bin/qpq-cdk-app.js` (the CDK app command). The CLI registers ts-node's
  transpile-only require hook at startup, so consumers need no root ts-node
  wiring; ts-node, typescript, aws-cdk, inquirer, @aws-sdk/client-sts and
  @rspack/dev-server are CLI dependencies (hoisted to the consumer root).
- **No cdk.json at all**: `qpq go` passes
  `--app 'node -r ts-node/register/transpile-only .../bin/qpq-cdk-app.js'` and
  `--output dist/qpq/cdk.out` on the cdk invocation, cwd = consumer root.
  CDK's Route53 context cache regenerates at the consumer root
  (`cdk.context.json`) — check it in.
- **deploy-rspack `appWorkspace/`** holds all the ported builders:
  getServiceRspackConfig, getServiceRemoteRspackConfig, getViewsRspackConfig,
  getDevServerRspackConfig, viewsWorkspace, federatedExports,
  getWorkspaceSourceAliases, getAppServiceQpqConfigs,
  writeFederatedTsconfigForApp. deploy-rspack now depends on
  quidproquo-config-aws AND quidproquo-dev-server (for reading
  defineDevServerOptions) — quidproquo-dev-server moved earlier in the root
  workspaces build order to satisfy this.
- **`quidproquo-dev-server/config` subpath** (folder-stub package.json):
  service `infrastructure.ts` files import `defineDevServerOptions` from there
  so the dev server's express/native deps never enter lambda bundles.
  `viewsWorkspace` resolves a views port as: defineDevServerOptions → legacy
  `"port"` in views package.json → 4200.
- **FrontendBundleOptions got its first field**: `sharedSingletons`
  (substring-matched against hoisted root deps → MF singletons). doccypoccy
  declares `['chakra', 'zod']`; react/react-dom/react-ish/quidproquo-web*
  remain built-in defaults.
- **Bundle options apply everywhere**: static lambda build, federated remote
  build (which also now externalizes layer modules), and the dev-server bundle
  (ignoreWarnings/ignoreModules merged across all hosted services).
- **deploy.config.json** is a `deployments` map (see Per-app configuration).
  `qpq go --deployment <name>` selects an entry and primes its env vars; the CDK
  app receives only DEPLOY_APP_NAME + DEPLOY_NAME and re-reads the same entry.
  `account.qpq.ts` / `bootstrap.qpq.ts` are default-exported `(ctx) => QPQConfig`
  fragments of app-specific EXTRAS — the workspace CDK app provides
  defineApplication + defineAwsServiceAccountInfo from the entry.
- **Dev server entry is generated** at `dist/qpq/dev-server/entry.ts` per
  `qpq go:dev:api` run; an optional `apps/<app>/devServer.config.ts`
  (default-exporting DevServerConfigOverrides) is imported when present.
  `qpq go:dev:web` runs all views dev servers in-process via RspackDevServer.
  `qpq go:dev` composes both: the API watch plus every views dev server in one
  process, so a single ctrl+c stops the whole stack.
- **Hooks**: `qpq hooks <name>` runs `qpq:<name>` (falling back to the plain
  `<name>` script when no qpq:-prefixed one exists) from every
  `apps/<app>/package.json` AND every package matched by the consumer root's
  `workspaces` globs, in dependency order (declared deps resolved by package
  name, edges only between packages in the run) with parallel execution
  (default jobs = min(8, cores - 1); `--jobs=1` forces serial). Output is
  line-prefixed per package; a failure skips that package's dependents but
  lets unrelated packages finish. doccypoccy root postinstall =
  `qpq hooks postinstall || true` (non-fatal while quidproquo-cli is linked,
  not registry-installed); chakra:typegen lives in docgen's `qpq:postinstall`.
  `qpq go` also fires a `qpq:predeploy` hook before building (single-app,
  sequential, unchanged).
- **`qpq go:docker`** is the parallel dockerized deploy, ported intact: local
  builds first (synth in-process, api/views bundles programmatic + concurrent,
  one CDK cloud assembly per service via `cdk synth --app <workspace app>`),
  then docker waves (inf → api+web → views sync). The deployer Dockerfile
  ships inside quidproquo-cli (`docker/`), pinned to the CLI's own aws-cdk
  version. Same knobs: GO_DOCKER_BUILD_CONCURRENCY / GO_DOCKER_DEPLOY_CONCURRENCY.
- **doccypoccy is slimmed**: tools/ deleted, 33 per-service rspack.config.ts
  deleted, ports migrated to defineDevServerOptions, chromium layer declares
  `modules: ['@sparticuz/chromium']` (fixing the found bug), the ignore-cruft
  moved to define*BundleOptions in each app's service-utils, root scripts are
  qpq aliases.

- **Platform drivers (added after landing)**: the CLI is internally split into
  `src/platforms/<platform>/` drivers (aws = go, goDocker, publish, stacks,
  cdkApp, viewsSync, remote, credentials) behind a `QpqPlatformDriver`
  interface. `qpq go` resolves the platform from the deployment's `platform`
  field in deploy.config.json and dispatches — a future `quidproquo-deploy-gcp`
  means adding `src/platforms/gcp/` + a registry entry, with no command-surface
  or consumer changes. Every command that loads a service config (go, go:dev,
  synth, setup, publish, teardown, clear-resources, migrate) resolves a
  deployment the same way (`--deployment`, else DEPLOY_NAME from a parent qpq
  command, else the sole entry, else a prompt). Platform validation and identity
  priming is a driver method (`prepareDeployment(name, entry)` — AWS checks
  `platformSettings` and fills AWS_DEFAULT_ACCOUNT/AWS_DEFAULT_REGION, docker is
  a no-op); the neutral code never names an AWS env var. The neutral deployment
  types live in quidproquo-core (`deployment/`, types only); the reader,
  validator and neutral primer live in quidproquo-config-aws alongside the aws
  narrowing, since both the CLI and the CDK app already depend on it.

- **Docker platform (proof of concept)**: `"platform": "docker"` on an
  environment makes `qpq go` bake the whole app into one self-hosting image —
  the QPQ dev server (full local platform emulation) + every service bundle +
  production views builds served statically (shell at /, remotes at
  /views/<svc>, SPA fallback) with a same-origin module-federation remote base
  (QPQ_VIEWS_REMOTE_BASE). Image context assembled at
  dist/qpq/docker-image/<app>/ (server bundle, web root, workspaces-stripped
  package.json npm-installed in-image for linux natives, locally-built
  quidproquo packages overlaid as vendor/). Dockerfile ships in
  quidproquo-cli/docker/dev-server/ (the go:docker deployer one moved to
  docker/cdk-deployer/). Dev server gained `webRoot` for the static serving.
  Single process + sqlite — demos/self-hosting, not production.

## Deferred / open

- validate-ts story once per-package tsconfigs are stubs.
- Port auto-assignment fallback when a service declares no defineDevServerOptions
  (currently defaults to 4200 after the legacy package.json fallback).
- The npm-link development workflow against quidproquo-cli itself (root
  devDep `quidproquo-cli@^0.1.4` needs the package published, or qpq:link).
- Scaffolder (`npm create quidproquo`) and `qpq upgrade` codemods — day two.
