// Shared Rspack config for a views microfrontend, with no per-service
// module-federation.config.ts. Exposes are computed from `// federated.export`
// markers at config-eval time; remotes are discovered from sibling views
// packages. Dev-only remotes: everything points at
// http://localhost:<port>/mf-manifest.json.
import { Nullable, QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { requireDomainResolver } from 'quidproquo-deploy-awscdk';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import fs from 'fs';
import path from 'path';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { Configuration, rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';

import { getQpqCircularCheckPlugin } from '../plugins';
import { getViewsContext } from './getViewsContext';
import { getWorkspaceSourceAliases } from './getWorkspaceSourceAliases';
import { requireQpqConfig } from './requireQpqConfig';
import { scanFederatedExposes } from './scanFederatedExposes';

type SharedConfig = Record<string, { singleton: boolean; requiredVersion?: string; eager?: boolean }>;

// The service's QPQ config (the same no-synth source-of-truth used by the
// backend dev server). Relies on the caller running with TS require hooks, as
// rspack.config.ts evaluation / ts-node already do.
const loadQpqConfig = (viewsDir: string): Nullable<QPQConfig> => {
  try {
    return requireQpqConfig(path.join(viewsDir, '..', 'service', 'src', 'infrastructure'));
  } catch (e) {
    console.warn(`[views-rspack] could not load QPQ config for ${viewsDir}:`, (e as Error).message);
    return null;
  }
};

// Module-federation `shared` rules: react/react-dom singleton, quidproquo-web*
// singleton, any react-ish dep singleton, plus whatever the service's
// `defineFrontendBundleOptions({ sharedSingletons })` adds (substring-matched
// against the hoisted root dependency names, e.g. 'chakra', 'zod').
const buildShared = (root: string, qpqConfig: Nullable<QPQConfig>): SharedConfig => {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const deps: Record<string, string> = rootPkg.dependencies || {};
  const shared: SharedConfig = {};

  const sharedSingletons = qpqConfig ? qpqCoreUtils.getFrontendBundleOptions(qpqConfig).sharedSingletons : [];

  // NOTE: no `eager` anywhere: every app (host included) enters through the
  // `import('./bootstrap')` async boundary, so shared modules are always
  // consumed after share-scope init. (Under MF 2.0 manifest remotes, eager
  // shared modules deadlock container init.)
  for (const [name, version] of Object.entries(deps)) {
    if (name === 'react' || name === 'react-dom') {
      shared[name] = { singleton: true, requiredVersion: version };
    } else if (name.startsWith('quidproquo-web')) {
      shared[name] = { singleton: true };
    } else if (sharedSingletons.some((singleton) => name.includes(singleton))) {
      shared[name] = { singleton: true };
    } else if (name.includes('react')) {
      shared[name] = { singleton: true, requiredVersion: version };
    }
  }

  return shared;
};

// Two DefinePlugin entries carrying the service's application config info into
// the views bundle (same shape the QpqWebPlugin injects for full web builds).
const buildQpqDefines = (qpqConfig: Nullable<QPQConfig>): Record<string, string> => {
  if (!qpqConfig) {
    return { 'process.env.QPQ_APPLICATION_CONFIG_INFO': JSON.stringify({}) };
  }

  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  const applicationConfigInfo = {
    environment: qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
    module: serviceName,
    name: qpqCoreUtils.getApplicationName(qpqConfig),
    feature: qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
  };

  return {
    [`process.env.QPQ_APPLICATION_CONFIG_INFO_${serviceName.toUpperCase()}`]: JSON.stringify(applicationConfigInfo),
    'process.env.QPQ_APPLICATION_CONFIG_INFO': JSON.stringify(applicationConfigInfo),
  };
};

const swcReactOptions = (isDev: boolean, tsx: boolean) => ({
  jsc: {
    parser: { syntax: 'typescript', tsx },
    transform: {
      react: { runtime: 'automatic', development: isDev, refresh: isDev },
    },
  },
});

export const getViewsRspackConfig = (viewsDir: string): Configuration => {
  const { root, self, siblings } = getViewsContext(viewsDir);
  const isDev = !!process.env.LOCAL_DEV_SERVER || process.env.NODE_ENV !== 'production';

  // Dev only: workspace packages (and linked quidproquo packages) bundle from
  // src/ instead of built dist, the same as the API dev server. That puts
  // their edits in rspack's watch graph, so views hot-reload without a build.
  // Prod builds keep resolving to built output.
  const aliases = isDev ? getWorkspaceSourceAliases(root).aliases : {};

  const exposes = scanFederatedExposes(viewsDir);
  const qpqConfig = loadQpqConfig(viewsDir);
  const domainResolver = qpqConfig ? requireDomainResolver(qpqConfig) : undefined;

  // Prod remote base URLs, baked to the PRIMARY root: shell (the MF host app) at
  // the site root, every other service at <views host>/<svc>. Resolved with the
  // app's resolver directly, since the `views` target belongs to shell's config.
  const getProdBaseUrl = (service: string): Nullable<string> => {
    try {
      if (!qpqConfig) {
        return null;
      }
      return service === 'shell'
        ? `https://${qpqWebServerUtils.resolvePrimaryHost(qpqConfig, {}, domainResolver)}`
        : `https://${qpqWebServerUtils.resolvePrimaryHost(qpqConfig, { subdomain: 'views' }, domainResolver)}/${service}`;
    } catch (e) {
      console.warn(`[views-rspack] no prod URL for ${service}:`, (e as Error).message);
      return null;
    }
  };

  // Same-origin remote base for single-host deploys (the docker platform
  // image): QPQ_VIEWS_REMOTE_BASE='/views' makes every remote resolve
  // root-relative against whatever origin serves the bundle (shell at /,
  // remotes at <base>/<svc>) instead of localhost ports or the AWS domains.
  const remoteBase = process.env.QPQ_VIEWS_REMOTE_BASE;

  const getRemoteBaseUrl = (service: string): Nullable<string> => {
    if (isDev) return `http://localhost:${siblings.find((sib) => sib.service === service)?.port}`;
    if (remoteBase) return service === 'shell' ? '' : `${remoteBase}/${service}`;
    return getProdBaseUrl(service);
  };

  // Remotes: alias -> mfName@<base>/mf-manifest.json (dev = localhost ports).
  // ONLY siblings that actually expose something: an app with no exposes emits a
  // consumer-style manifest with no remoteEntry, and registering it as a remote
  // makes the MF runtime fail snapshot resolution (RUNTIME-011/015).
  const remotes: Record<string, string> = {};
  for (const sib of siblings) {
    if (Object.keys(scanFederatedExposes(sib.viewsDir)).length === 0) continue;
    const baseUrl = getRemoteBaseUrl(sib.service);
    if (baseUrl === null) continue;
    remotes[sib.alias] = `${sib.mfName}@${baseUrl}/mf-manifest.json`;
  }

  const htmlTemplate = path.join(viewsDir, 'src', 'index.html');
  const favicon = path.join(viewsDir, 'src', 'favicon.ico');

  // Optional static assets served from the output root (web app manifest,
  // service worker, PWA icons…): anything under src/public is copied verbatim.
  const publicDir = path.join(viewsDir, 'src', 'public');

  // main.ts for TypeScript apps, main.js for JavaScript apps
  const tsEntry = path.join(viewsDir, 'src', 'main.ts');
  const entry = fs.existsSync(tsEntry) ? tsEntry : path.join(viewsDir, 'src', 'main.js');

  return {
    mode: isDev ? 'development' : 'production',
    context: viewsDir,
    entry,
    devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',

    output: {
      path: path.join(root, 'dist', 'apps', self.appName, 'services', self.service, 'views'),
      publicPath: 'auto',
      uniqueName: self.mfName,
      clean: true,
      // Chunks are cached (CloudFront + browser heuristics) under their
      // filename, while remoteEntry.js / mf-manifest.json / index.html are
      // cache-bypassed. Without content hashes a redeploy pairs a stale cached
      // main.js with a fresh remoteEntry.js and module ids no longer line up
      // ("Cannot read properties of undefined (reading 'call')"). Hash
      // everything, in every env; the MF plugin pins remoteEntry.js itself.
      filename: '[name].[contenthash:8].js',
      chunkFilename: '[name].[contenthash:8].js',
      cssFilename: '[name].[contenthash:8].css',
      cssChunkFilename: '[name].[contenthash:8].css',
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: aliases,
      fallback: { path: require.resolve('path-browserify') },
    },

    // quidproquo's ESM lib references __dirname/__filename; webpack silently
    // mocked these for web targets, rspack warns unless set explicitly.
    node: { __dirname: 'mock', __filename: 'mock' },

    // @rspack/cli enables lazy compilation on `serve` whenever the config leaves
    // this undefined, and its proxy breaks module-federation entries (the
    // `import('./bootstrap')` async boundary hangs forever with
    // "…bootstrap.tsx!lazy-compilation-proxy" errors). Top-level option in
    // Rspack 2 (not experiments.*), so set it explicitly off.
    lazyCompilation: false,

    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          loader: 'builtin:swc-loader',
          options: swcReactOptions(isDev, false),
        },
        {
          test: /\.[jt]sx$/,
          exclude: /node_modules/,
          loader: 'builtin:swc-loader',
          options: swcReactOptions(isDev, true),
        },
        {
          // JavaScript apps ship ESM-syntax .js inside type:commonjs packages;
          // 'auto' accepts both module syntaxes.
          test: /\.js$/,
          exclude: /node_modules/,
          type: 'javascript/auto',
        },
        { test: /\.css$/, type: 'css/auto' },
        // Markdown imports resolve to the raw file contents (e.g. in-app help pages).
        { test: /\.md$/, type: 'asset/source' },
        { test: /\.(png|jpe?g|gif|webp|avif|ico)$/, type: 'asset' },
        { test: /\.(woff2?|ttf|otf|eot)$/, type: 'asset/resource' },
      ],
    },

    plugins: [
      new ModuleFederationPlugin({
        name: self.mfName,
        filename: 'remoteEntry.js',
        manifest: true,
        exposes,
        remotes,
        shared: buildShared(root, qpqConfig),
        // Default 'version-first' blocks module evaluation on collecting share
        // info from every remote entry; with nested manifest remotes
        // (host -> shell -> design/auth) it deadlocks silently and the app never
        // mounts. 'loaded-first' resolves shares from whatever is already loaded.
        shareStrategy: 'loaded-first',
        dts: false,
      }),
      new rspack.HtmlRspackPlugin({
        template: htmlTemplate,
        ...(fs.existsSync(favicon) ? { favicon } : {}),
      }),
      ...(fs.existsSync(publicDir) ? [new rspack.CopyRspackPlugin({ patterns: [{ from: publicDir, to: '.' }] })] : []),
      new rspack.DefinePlugin(buildQpqDefines(qpqConfig)),
      getQpqCircularCheckPlugin(),
      ...(isDev ? [new ReactRefreshRspackPlugin()] : []),
    ],

    watchOptions: { ignored: ['**/dist', '**/dist-tsc', '**/node_modules'] },

    // Dev terminal output: errors only. Many servers share one terminal in
    // go:dev:web; stats covers compiler output (rebuild summaries, plugin
    // warnings), infrastructureLogging covers dev-server chatter (the
    // Local/Network URLs, which the boot script already prints itself).
    stats: isDev ? 'errors-only' : 'normal',
    infrastructureLogging: { level: isDev ? 'error' : 'info' },

    devServer: {
      port: self.port,
      hot: true,
      historyApiFallback: true,
      allowedHosts: 'all',
      headers: { 'Access-Control-Allow-Origin': '*' },
      client: { overlay: { errors: true, warnings: false } },
    },
  };
};
