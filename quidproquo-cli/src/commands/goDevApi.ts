// `qpq go:dev:api` — boots the QPQ local dev server. Resolves the app,
// generates the dev-server entry, builds the rspack config, then runs rspack
// in watch mode, restarting the server process on every successful rebuild.
//
// A restart is not instant: the server drains in-flight work and checkpoints
// its stores on the way out (typically tens of ms, 5s worst case), and this
// command waits for that before starting the replacement.
//
// The one thing NOT hot-reloaded is the qpq configs themselves: each service's
// infrastructure.ts is evaluated once at launch and baked into the
// `quidproquo-dynamic-loader` virtual module — config changes need a full
// `go:dev:api` restart.
import { getAppServiceQpqConfigs, getDevServerRspackConfig } from 'quidproquo-deploy-rspack';

import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { rspack } from '@rspack/core';

import { primeDeployEnvFromConfig } from '../lib/deployEnv';
import { writeDevServerEntry } from '../lib/devServerEntry';
import { getRoot } from '../lib/discovery';
import { killChildWithEscalation } from '../lib/killChildWithEscalation';
import { killOtherQpqDevProcesses, killStaleListeners } from '../lib/killStaleListeners';
import { resolveAppSelection } from '../lib/resolveAppSelection';

// 8080/8888 are set in the generated entry; 3001 is the quidproquo-dev-server
// file-storage (secure URL) default port.
const DEV_SERVER_PORTS = [8080, 8888, 3001];
const DEV_SERVER_BUNDLE_PATH = path.join('dist', 'qpq', 'dev-server', 'main.js');

export const goDevApiCommand = async (argv: string[]): Promise<void> => {
  const root = getRoot();
  const appName = await resolveAppSelection({ argv, envVar: 'QPQ_DEV_APP' });
  process.env.QPQ_DEV_APP = appName;
  primeDeployEnvFromConfig(appName);
  console.log(`Dev server for app [${appName}]`);

  // Catches a lingering watcher from a previous run even if its spawned
  // child already exited (see killOtherQpqDevProcesses) — then the usual
  // port-based sweep for anything else still bound to our ports.
  killOtherQpqDevProcesses(root);
  killStaleListeners(DEV_SERVER_PORTS, (command) => command.includes(DEV_SERVER_BUNDLE_PATH));

  const qpqConfigs = getAppServiceQpqConfigs(root, appName);
  const entry = writeDevServerEntry(root, appName);
  const rspackConfig = getDevServerRspackConfig({ root, entry, qpqConfigs });
  const bundlePath = path.join(root, DEV_SERVER_BUNDLE_PATH);
  const env = { ...process.env, QPQ_DEV_APP: appName };

  // The long-lived server process (HTTP 8080 / WS 8888), restarted per rebuild.
  let child: ChildProcess | null = null;
  let restartQueued = false;

  const startServer = (): void => {
    child = spawn('node', [bundlePath], { stdio: 'inherit', env });
    child.on('exit', (code) => {
      child = null;
      if (!restartQueued) {
        // Crashed (or exited) on its own — leave it down; the next successful
        // rebuild (i.e. the next file save) brings it back up.
        console.log(`Dev server exited with code ${code}. Save a file to restart it.`);
      }
    });
  };

  const restartServer = (): void => {
    if (restartQueued) return;
    if (!child) {
      startServer();
      return;
    }
    restartQueued = true;
    child.once('exit', () => {
      restartQueued = false;
      startServer();
    });

    // Not a bare kill: the server drains in-flight work before it exits, so it
    // needs asking properly and then a hard backstop if it wedges. Waiting for
    // the exit is what keeps the ports free for the replacement.
    void killChildWithEscalation(child);
  };

  console.log('Bundling dev server (watch mode)...');
  let lastHash: string | null | undefined;
  const compiler = rspack(rspackConfig);
  compiler.watch({ aggregateTimeout: 200 }, (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    if (stats?.hasErrors()) {
      console.error(stats.toString({ colors: true, chunks: false, modules: false }));
      console.log('Build failed — dev server not restarted. Fix the error and save again.');
      return;
    }
    // Skip no-op rebuilds (e.g. the virtual-module-triggered second compile at
    // startup): only restart when the output actually changed.
    if (stats?.hash === lastHash && child) {
      return;
    }
    lastHash = stats?.hash;
    console.log(child ? 'Rebuilt. Restarting dev server...' : 'Dev server bundled. Starting...');
    restartServer();
  });

  // Wait for the server to finish draining before tearing the watcher down and
  // exiting: closing the compiler first would exit the parent while the child
  // is still writing, which is the race this whole path exists to close.
  //
  // SIGTERM as well as SIGINT, and it is load-bearing rather than symmetry for
  // its own sake. This process is a WRAPPER: the dev server that handles
  // signals and drains its work is the child it spawned. Without a handler
  // here, SIGTERM (what `docker stop` sends, and what any script stopping this
  // programmatically sends) kills the wrapper outright on the default
  // disposition, the child never gets asked to stop, and every guarantee the
  // dev server's shutdown sequence makes is bypassed. go:dev:web already
  // handles both.
  let shuttingDown = false;

  const handleShutdownSignal = async (): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    restartQueued = true; // suppress the crash log / rebuild-restart on our own kill

    if (child) {
      await killChildWithEscalation(child);
    }

    compiler.close(() => process.exit(0));
  };

  process.on('SIGINT', () => {
    void handleShutdownSignal();
  });

  process.on('SIGTERM', () => {
    void handleShutdownSignal();
  });
};
