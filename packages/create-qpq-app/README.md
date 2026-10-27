# create-qpq-app

Scaffold a new [quidproquo](https://github.com/qpqjs/quidproquo) app:

```bash
npx create-qpq-app my-app
cd my-app
npm run dev
```

You get a full workspace with five services (`admin`, `auth`, `design`, `shell` and `todo`) that builds, runs locally on the qpq dev server, and deploys as a single docker image with `npm run deploy`.

The api comes up on `http://localhost:8080` and the web on `http://localhost:3080`:

```bash
curl http://localhost:8080/api/shell/v1/health
# {"status":"healthy","service":"shell","checkedAt":"..."}
```

Node.js 24 or newer is required. Docker is only needed to deploy.

## Options

```
npx create-qpq-app <app-name> [options]

--language <typescript|javascript>   skip the language prompt
--domain <domain>                    app domain (default: <app-name>.example.com)
--docker-registry <host[:port]>      registry qpq go pushes the image to (e.g. 192.168.8.88:5000)
--docker-host <address>              address browsers use for the docker host (e.g. 192.168.8.88)
--no-git                             skip git init
--no-install                         skip npm install
```

Pass `--language javascript` and you get the same app with type annotations stripped and JSX preserved, running on the same toolchain.

The two docker flags are asked for when you run interactively and can be left blank. They fill the docker deployments' `platformSettings` in `apps/<app>/deploy.config.json` (registry, `linux/amd64`, `publicHost`, and an appdata `dataPath`), so `npm run deploy` pushes an image and writes a `docker-compose.yml` that runs on a self-hosting box like Unraid as is. Edit the file later to change any of it.

## How it works

The template is a snapshot of quidproquojs.com, a real and continuously built qpq workspace, captured into this package at publish time. Scaffolding runs a pipeline of self-contained steps: prune the docs site, prune the website app, apply your app's identity and domain, pin the quidproquo versions, git init, install.

The generated app pins the `quidproquo-*` versions this package was published with. The whole family releases in lockstep, so those versions are always a set that was built and tested together.

## Status

Pre-1.0 and under active development. The generated app changes shape between releases.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
