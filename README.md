<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/qpqjs/quidproquo/main/assets/qpq-lockup-dark.svg">
  <img src="https://raw.githubusercontent.com/qpqjs/quidproquo/main/assets/qpq-lockup.svg" alt="quidproquo" width="440">
</picture>

<p><strong>Build web applications out of pure functions.</strong></p>

[![npm](https://img.shields.io/npm/v/quidproquo.svg?color=0a7bbb&label=npm)](https://www.npmjs.com/package/quidproquo)
[![license](https://img.shields.io/badge/license-MIT-0a7bbb.svg)](https://github.com/qpqjs/quidproquo/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D24-0a7bbb.svg)](https://nodejs.org)

[Getting started](#getting-started) &nbsp;·&nbsp; [How it works](#how-it-works) &nbsp;·&nbsp; [Packages](#packages) &nbsp;·&nbsp; [Docs](https://docs.quidproquojs.com)

</div>

---

Business logic in quidproquo is written as generator functions called **stories**. A story never calls the clock, the database, or the network directly. It yields a typed action describing what it wants, and the runtime hands that action to whichever implementation fits the platform it is running on.

The same story runs on AWS Lambda, in a Node process, in a browser, or against fixtures in a test, with no changes to the code.

```typescript
function* askGreet(name: string): AskResponse<string> {
  const now = yield* askDateNow();
  return `hello ${name}, it is ${now}`;
}
```

`askDateNow()` does not read the clock. It yields `{ type: '@quidproquo-core/Date/Now' }` and suspends, and the runtime resolves it and resumes the generator with the answer.

## Getting started

```bash
npx create-qpq-app myapp
cd myapp
npm run dev
```

That scaffolds a complete working app (five services, a local dev server, and a one-image docker deploy), installs it, builds it, and makes the first commit. `npm run dev` runs the backend and every frontend dev server in one process, so one ctrl+c stops everything.

The api comes up on `http://localhost:8080` and the web on `http://localhost:3080`. Check it is alive:

```bash
curl http://localhost:8080/api/shell/v1/health
# {"status":"healthy","service":"shell","checkedAt":"..."}
```

You need **Node.js 24 or newer**. Docker is only needed when you deploy, not for local dev.

<details>
<summary>Scaffolder options</summary>

```bash
npx create-qpq-app <app-name> [options]

--language <typescript|javascript>   skip the language prompt
--domain <domain>                    app domain (default: <app-name>.example.com)
--no-git                             skip git init
--no-install                         skip npm install
```

Pass `--language javascript` and you get the same app with type annotations stripped and JSX preserved, running on the same toolchain.

</details>

## How it works

Here is the health route the scaffolded app ships with:

```typescript
import { askDateNow, AskResponse, HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo';
import { dynamicRoute } from '@qpqjs/features';

export const health = dynamicRoute(
  ['GET', '/health'],
  function* healthCheck(event: HTTPEvent): AskResponse<HTTPEventResponse> {
    const checkedAt = yield* askDateNow();

    return qpqWebServerUtils.toJsonEventResponse({
      status: 'healthy',
      service: 'shell',
      checkedAt,
    });
  },
);
```

Locally the clock is answered by the dev server, in production by whatever platform you deployed to, and in a test by a fixed timestamp you supply. That is why every function you call from a story is named `ask*`: it is a request, it has an answer, and it must be called with `yield*`.

| Term | What it is |
| --- | --- |
| **Action** | A plain, serializable object with a type and an optional payload |
| **Requester** | The `ask*` generator your story calls to yield an action |
| **Story** | A generator function composing requesters into business logic |
| **Processor** | The platform-specific function that actually performs an action |
| **Runtime** | The loop that runs a story, routes each yielded action to a processor, and logs the whole thing |

Three things fall out of that arrangement:

- **Tests need no infrastructure.** Mock actions by type and assert on the result.
  ```typescript
  const result = runStory(askGreet('world'), { [DateActionType.Now]: '2026-01-01T00:00:00.000Z' });
  ```
- **Moving platforms is a config change.** The stories do not know or care which processor set answered them.
- **Every run leaves a complete log.** Because all side effects pass through the runtime, you get execution logs, replay, and statement-level traces without instrumenting anything. That is what the [admin console](https://github.com/qpqjs/quidproquo/tree/main/packages/web-admin) reads.

The [ESLint plugin](https://github.com/qpqjs/quidproquo/tree/main/packages/eslint-config) enforces both halves of the `ask` contract: always `yield*` an ask call, never name a plain function `ask*`.

## Packages

**Start here**

| Package | Description |
| --- | --- |
| [create-qpq-app](https://github.com/qpqjs/quidproquo/tree/main/packages/create-qpq-app) | Scaffolder. `npx create-qpq-app my-app` |
| [quidproquo](https://github.com/qpqjs/quidproquo/tree/main/packages/quidproquo) | The main entry point. Re-exports core and webserver |
| [@qpqjs/cli](https://github.com/qpqjs/quidproquo/tree/main/packages/cli) | The `qpq` CLI: dev, build, deploy and teardown |

**Framework**

| Package | Description |
| --- | --- |
| [@qpqjs/core](https://github.com/qpqjs/quidproquo/tree/main/packages/core) | Actions, stories, the runtime, and the config system |
| [@qpqjs/webserver](https://github.com/qpqjs/quidproquo/tree/main/packages/webserver) | Routes, apis, websockets, dns, email, and the web-side config |
| [@qpqjs/features](https://github.com/qpqjs/quidproquo/tree/main/packages/features) | Ready-made features: admin, auth users, tenants, event documents |

**Runtimes**

| Package | Description |
| --- | --- |
| [@qpqjs/actionprocessor-js](https://github.com/qpqjs/quidproquo/tree/main/packages/actionprocessor-js) | Processors that need no platform at all |
| [@qpqjs/actionprocessor-node](https://github.com/qpqjs/quidproquo/tree/main/packages/actionprocessor-node) | Node processors |
| [@qpqjs/actionprocessor-aws](https://github.com/qpqjs/quidproquo/tree/main/packages/actionprocessor-aws) | AWS processors and the Lambda entry handlers |
| [@qpqjs/actionprocessor-web](https://github.com/qpqjs/quidproquo/tree/main/packages/actionprocessor-web) | Browser processors |
| [@qpqjs/dev-server](https://github.com/qpqjs/quidproquo/tree/main/packages/dev-server) | Runs your whole app locally on real code paths |

**Frontend**

| Package | Description |
| --- | --- |
| [@qpqjs/web](https://github.com/qpqjs/quidproquo/tree/main/packages/web) | Browser utilities, no UI framework required |
| [@qpqjs/web-react](https://github.com/qpqjs/quidproquo/tree/main/packages/web-react) | React bindings: state store, hooks, auth, websockets |
| [@qpqjs/web-admin](https://github.com/qpqjs/quidproquo/tree/main/packages/web-admin) | The admin console: logs, traces, config, maintenance |

**Build and deploy**

| Package | Description |
| --- | --- |
| [@qpqjs/config-aws](https://github.com/qpqjs/quidproquo/tree/main/packages/config-aws) | AWS-specific config settings |
| [@qpqjs/deploy-awscdk](https://github.com/qpqjs/quidproquo/tree/main/packages/deploy-awscdk) | Turns a qpq config into CDK stacks |
| [@qpqjs/deploy-rspack](https://github.com/qpqjs/quidproquo/tree/main/packages/deploy-rspack) | Rspack bundling for services and federated remotes |
| [@qpqjs/deploy-webpack](https://github.com/qpqjs/quidproquo/tree/main/packages/deploy-webpack) | The same, on webpack |

**Tooling**

| Package | Description |
| --- | --- |
| [@qpqjs/tsconfig](https://github.com/qpqjs/quidproquo/tree/main/packages/tsconfig) | Shared TypeScript config |
| [@qpqjs/eslint-config](https://github.com/qpqjs/quidproquo/tree/main/packages/eslint-config) | Shared ESLint config and the qpq lint rules |
| [@qpqjs/testing](https://github.com/qpqjs/quidproquo/tree/main/packages/testing) | Generator assertions and vitest matchers |

**Integrations**

| Package | Description |
| --- | --- |
| [@qpqjs/neo4j](https://github.com/qpqjs/quidproquo/tree/main/packages/neo4j) | Neo4j behind the graph database actions |
| [@qpqjs/xstate](https://github.com/qpqjs/quidproquo/tree/main/packages/xstate) | XState machines as qpq actions |

## Working on the framework

The repo is an npm workspace. From the root:

```bash
npm install
npm run build          # build every package
npm run build:lite     # only what changed since the last build
npm run test           # vitest across the workspace
npm run lint           # eslint across the workspace
npm run validate       # lint, build, test, and typecheck the test suite
```

Target a single package with `-w`, for example `npm run watch -w @qpqjs/core`.

Tests run on vitest and alias sibling packages to their `src`, so you do not need to build before running them.

## Status

Pre-1.0. The whole family releases in lockstep, so any set of `@qpqjs/*` versions that share a number was built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

Full docs, including the action reference, live at **[docs.quidproquojs.com](https://docs.quidproquojs.com)**. The site is built from [quidproquojs.com/docusaurus](https://github.com/qpqjs/quidproquo/tree/main/quidproquojs.com/docusaurus) in this repo, and the app around it is a real qpq workspace that doubles as the `create-qpq-app` template.

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
