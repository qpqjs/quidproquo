# quidproquo-web-admin

The admin console for [quidproquo](https://github.com/qpqjs/quidproquo) backends: log viewing, execution traces, config inspection, maintenance, and auth, wired to your deployed services.

This is a React component library, not a standalone app. It ships dual CommonJS and ESM builds with type declarations, compiled with `tsc`. There is no bundler, so you import `<App />` into your own host application and build and serve it however you like. React (`>=18.3.1`) is a peer dependency, so the host owns the React instance.

```bash
npm install quidproquo-web-admin
```

## Usage

Mount `<App />`, telling it how to resolve the URLs of your deployed services:

```tsx
import { App } from 'quidproquo-web-admin';
import { BaseUrlResolvers } from 'quidproquo-web-react';
import { createRoot } from 'react-dom/client';

const urlResolvers: BaseUrlResolvers = {
  getApiUrl: () => 'https://api.example.com',
  getWsUrl: () => 'wss://ws.example.com',
};

createRoot(document.getElementById('root')!).render(<App urlResolvers={urlResolvers} />);
```

The backend half of the console lives in `quidproquo-features`, added to a service with `defineAdminSettings`.

## What you get

Because every action a story yields passes through the qpq runtime, each run leaves a complete execution log. The console reads those logs, so you can search executions, open one, and see every action it took with its inputs and outputs. Traces go further and replay a story to show it statement by statement with local values, rendered over the original source.

## Addons

The admin UI can be extended with addon tabs. This package does not own the loading mechanism. The host application supplies a `loadAddons` function (module federation, dynamic `import()`, a static array, whatever suits you), and the admin renders whatever addons it returns.

```tsx
import { App, createAddon, LoadFederatedAddons } from 'quidproquo-web-admin';

const MyTab = () => <div>Hello from an addon</div>;

const loadAddons: LoadFederatedAddons = async ({ baseUrlResolvers, accessToken }) => [createAddon('My Tab', MyTab)];

<App urlResolvers={urlResolvers} loadAddons={loadAddons} />;
```

When `loadAddons` is omitted, no addons are loaded.

## Build

```bash
# from the repo root
npm run build -w quidproquo-web-admin

# watch ESM during development
npm run watch -w quidproquo-web-admin
```

That runs `tsc` twice, emitting `lib/esm` (`module`, `types`) and `lib/commonjs` (`main`).

## Status

Pre-1.0. The whole `quidproquo-*` family releases in lockstep, so versions that share a number were built and tested together. Expect APIs to move between releases, and pin your versions.

## Documentation

[docs.quidproquojs.com](https://docs.quidproquojs.com)

## License

MIT. See [LICENSE](https://github.com/qpqjs/quidproquo/blob/main/LICENSE).
