import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { askRunPendingMigrations } from 'quidproquo-webserver';

import * as crypto from 'crypto';
import path from 'path';

import { createTinkerInterface } from './implementations';
import { awaitDevServerIdle, installDevServerShutdownHandlers, markDevServerReady, runDevServerShutdown } from './logic';
import { apiPlugin, DEV_SERVER_PLUGINS, DevServerPlugin, MIGRATION_DEV_SERVER_PLUGINS, startDevServerPlugins } from './plugins';
import { DevServerConfig, DevServerConfigOverrides, ResolvedDevServerConfig, TinkerInterface, TinkerOptions } from './types';

export * from './implementations';
export * from './logic/inFlight';
export * from './plugins';

export const getDevConfigs = (qpqConfigs: QPQConfig[], devServerConfigOverrides?: DevServerConfigOverrides): QPQConfig[] => {
  return qpqConfigs.map((qpqConfig) => {
    return [
      // Base config
      ...qpqConfig,

      // all service override
      ...(devServerConfigOverrides?.allServices || []),

      // specific service override
      ...((devServerConfigOverrides?.byService || {})[qpqCoreUtils.getApplicationModuleName(qpqConfig)] || []),
    ];
  });
};

const resolveDevServerConfig = (devServerConfig: DevServerConfig, devServerConfigOverrides?: DevServerConfigOverrides): ResolvedDevServerConfig => {
  const runtimePath = devServerConfig.runtimePath || '.qpq-runtime';

  return {
    ...devServerConfig,
    runtimePath,
    qpqConfigs: getDevConfigs(devServerConfig.qpqConfigs, devServerConfigOverrides),

    fileStorageConfig: {
      storagePath: path.join(runtimePath, devServerConfig.fileStorageConfig?.storagePath || 'storage'),
      secureUrlHost: devServerConfig.fileStorageConfig?.secureUrlHost || 'localhost',
      secureUrlPort: devServerConfig.fileStorageConfig?.secureUrlPort || 3001,
      secureUrlSecret: devServerConfig.fileStorageConfig?.secureUrlSecret || crypto.randomBytes(32).toString('hex'),
    },

    webRoot: devServerConfig.webRoot,

    logServiceName: devServerConfig.logServiceName,

    delay: devServerConfig.delay,
  };
};

// Start a set of plugins and wire the signals that stop them again. Every
// entry point does exactly this; only the plugin list differs.
const startPluginsWithShutdown = async (plugins: DevServerPlugin[], resolvedDevServerConfig: ResolvedDevServerConfig): Promise<void> => {
  const shutdownTasks = await startDevServerPlugins(plugins, resolvedDevServerConfig);

  installDevServerShutdownHandlers(() => runDevServerShutdown(shutdownTasks));

  // Every plugin is up. Anything waiting on GET /admin/service/ready can go.
  markDevServerReady();
};

export const startDevServer = async (devServerConfig: DevServerConfig, devServerConfigOverrides?: DevServerConfigOverrides) => {
  console.log('Starting QPQ Dev Server');

  const resolvedDevServerConfig = resolveDevServerConfig(devServerConfig, devServerConfigOverrides);

  await startPluginsWithShutdown(DEV_SERVER_PLUGINS, resolvedDevServerConfig);

  // Park forever. Every plugin's start resolves once it is up, so there is
  // nothing left to await; the process ends through the signal handlers
  // installed above. This is the ONE place that blocks - it used to be four
  // implementations each ending in the same trick to stop a Promise.all
  // resolving, which is what stranded their handles and made shutdown
  // impossible in the first place.
  await new Promise<void>(() => {});
};

/**
 * Run every pending migration once, then resolve. The engine behind `qpq migrate`.
 *
 * Migrations are triggered by a deploy event, and nothing locally ever deploys, so without
 * this they simply never run on a dev machine — you find out what a migration does the first
 * time you ship it. This runs them through the SAME queue the deployed path uses, so a local
 * run rehearses the real thing rather than a convenient approximation.
 *
 * Each service is migrated in turn, and the queue is drained before moving on, so ordering
 * between a migration and anything it enqueues holds.
 */
export const runMigrations = async (
  devServerConfig: DevServerConfig,
  devServerConfigOverrides?: DevServerConfigOverrides,
): Promise<Record<string, string[]>> => {
  const resolvedDevServerConfig = resolveDevServerConfig(devServerConfig, devServerConfigOverrides);

  // Awaited, unlike before: a plugin's start resolves once its listeners are
  // registered, so there is no window to sleep through any more.
  const shutdownTasks = await startDevServerPlugins(MIGRATION_DEV_SERVER_PLUGINS, resolvedDevServerConfig);

  const tinker = createTinkerInterface(resolvedDevServerConfig);
  const ran: Record<string, string[]> = {};

  for (const serviceName of tinker.getServices()) {
    tinker.switchService(serviceName);

    const result = await tinker.run(askRunPendingMigrations);

    if (result.error) {
      throw new Error(`Migration failed for service [${serviceName}]: ${result.error.errorText}`);
    }

    // Enqueueing is not running: wait for the handlers themselves before calling this service
    // done, or a failure would surface after we had already reported success. That includes
    // the kvs-stream projections a migration's writes trigger, not just the queue.
    await awaitDevServerIdle();

    ran[serviceName] = result.result ?? [];
  }

  // The same teardown a signal would run: drain anything still going, then
  // checkpoint the stores before this one-shot process exits.
  await runDevServerShutdown(shutdownTasks);

  return ran;
};

export const startTinker = async (
  devServerConfig: DevServerConfig,
  devServerConfigOverrides?: DevServerConfigOverrides,
  tinkerOptions?: TinkerOptions,
): Promise<TinkerInterface> => {
  console.log('Starting QPQ Tinker Environment...');

  const resolvedDevServerConfig = resolveDevServerConfig(devServerConfig, devServerConfigOverrides);

  // A tinker session runs the same stories against the same subsystems, so
  // ctrl+c and `.exit` have the same work to lose. The api server is the one
  // thing a session does not need unless it asks for it.
  const plugins = tinkerOptions?.includeHttpServer ? DEV_SERVER_PLUGINS : DEV_SERVER_PLUGINS.filter((plugin) => plugin !== apiPlugin);

  await startPluginsWithShutdown(plugins, resolvedDevServerConfig);

  // Create and return the tinker interface
  return createTinkerInterface(resolvedDevServerConfig, tinkerOptions);
};
