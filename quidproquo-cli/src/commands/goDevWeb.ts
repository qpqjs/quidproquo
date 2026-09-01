// `qpq go:dev:web` — boots every views microfrontend's Rspack dev server
// in-process (shell is the MF host app, plus all remotes on their own ports).
// Everything is served dynamically; remotes resolve at runtime via
// mf-manifest.json on localhost ports. Programmatic — no per-views
// rspack.config.ts or npm serve script needed.
//
// Usage:
//   qpq go:dev:web
//   qpq go:dev:web --only shell,design
//   qpq go:dev:web --app <name>
import { getAllViews, getViewsRspackConfig } from 'quidproquo-deploy-rspack';

import http from 'http';
import { rspack } from '@rspack/core';
import { RspackDevServer } from '@rspack/dev-server';

import { getArgValue } from '../lib/args';
import { hasArgFlag } from '../lib/args';
import { primeDeployEnvFromConfig } from '../lib/deployEnv';
import { getRoot } from '../lib/discovery';
import { KEEP_OTHER_DEV_SERVERS_FLAG } from '../lib/keepOtherDevServersFlag';
import { isQpqCliCommand, killStaleListeners, reportPortHolders } from '../lib/killStaleListeners';
import { resolveAppSelection } from '../lib/resolveAppSelection';

export type GoDevWebOptions = {
  // The in-place "(started)" chip rewrite assumes this command owns the
  // terminal; when stdout is shared with the API dev server (combined
  // `qpq go:dev`) the cursor math breaks. The plain-line fallback is just a
  // wall of "  auth started" noise interleaved with the API output, so drop
  // the ready status altogether there.
  hideStartedStatus?: boolean;
};

export const goDevWebCommand = async (argv: string[], options: GoDevWebOptions = {}): Promise<void> => {
  const root = getRoot();
  const appName = await resolveAppSelection({ argv, envVar: 'QPQ_DEV_APP' });

  process.env.LOCAL_DEV_SERVER = 'true';
  process.env.NODE_ENV = 'development';
  primeDeployEnvFromConfig(appName);

  const only = getArgValue(argv, '--only')
    ?.split(',')
    .map((s) => s.trim());

  let views = getAllViews(root, appName);
  if (only) views = views.filter((v) => only.includes(v.service));
  if (views.length === 0) {
    console.error('No views projects found.');
    process.exit(1);
  }

  // See goDevApi for why this is opt-out rather than always-on.
  if (hasArgFlag(argv, KEEP_OTHER_DEV_SERVERS_FLAG)) {
    reportPortHolders(views.map((v) => v.port));
  } else {
    killStaleListeners(
      views.map((v) => v.port),
      isQpqCliCommand,
    );
  }

  // Every RspackDevServer.start() registers its own SIGINT/SIGTERM handler on
  // process — with a dozen views servers in one process that trips node's
  // default 10-listener warning. Size the limit to the fleet.
  process.setMaxListeners(Math.max(process.getMaxListeners(), views.length * 2 + 10));

  // Service names are padded to a common width so the "(started)" chips align.
  const serviceColumnWidth = Math.max(...views.map((v) => v.service.length));

  console.log(`Starting ${views.length} views dev servers for [${appName}]:`);
  for (const v of views) console.log(`  http://localhost:${v.port}  ${v.service.padEnd(serviceColumnWidth)}`);

  const servers: RspackDevServer[] = [];
  let shuttingDown = false;

  const shutdown = (code: number): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    Promise.allSettled(servers.map((server) => server.stop())).then(() => process.exit(code));
  };

  // The URL list above gets a yellow "(started)" chip appended in place as
  // each dev server begins answering HTTP. The in-place rewrite moves the
  // cursor up past everything printed since the list, so every line printed
  // below it MUST go through logBelowList to keep the offset accurate.
  let linesBelowList = 0;

  const logBelowList = (line: string): void => {
    console.log(line);
    linesBelowList += 1;
  };

  const markStarted = (index: number): void => {
    const v = views[index];
    if (!process.stdout.isTTY) {
      logBelowList(`  ${v.service} started`);
      return;
    }
    const line = `  http://localhost:${v.port}  ${v.service.padEnd(serviceColumnWidth)}  \x1b[33m(started)\x1b[0m`;
    const up = linesBelowList + (views.length - index);
    process.stdout.write(`\x1b[${up}F\x1b[2K${line}\x1b[${up}E`);
  };

  const pollUntilStarted = (index: number): void => {
    const attempt = (): void => {
      if (shuttingDown) return;
      const req = http.get(
        {
          host: 'localhost',
          port: views[index].port,
          path: '/',
          timeout: 1000,
        },
        (res) => {
          res.resume();
          markStarted(index);
        },
      );
      req.on('error', () => setTimeout(attempt, 500));
      req.on('timeout', () => req.destroy());
    };
    attempt();
  };

  for (const [index, view] of views.entries()) {
    const config = getViewsRspackConfig(view.viewsDir);
    const compiler = rspack(config);
    const server = new RspackDevServer(config.devServer || { port: view.port }, compiler);
    servers.push(server);

    try {
      await server.start();
    } catch (e) {
      logBelowList(`  [${view.service}] failed to start: ${(e as Error).message} — shutting down all views servers.`);
      shutdown(1);
      return;
    }

    // markStarted is the only consumer of the ready signal, so there is
    // nothing to poll for when the status is hidden.
    if (!options.hideStartedStatus) pollUntilStarted(index);
  }

  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));
};
