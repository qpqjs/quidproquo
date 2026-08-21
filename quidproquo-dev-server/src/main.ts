import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { askRunPendingMigrations } from 'quidproquo-webserver';

import * as crypto from 'crypto';
import path from 'path';

import { closeAllKvsRepositories } from './logic/keyValueStore/getKvsRepository';
import { warnIfLegacyJsonKvsStores } from './logic/keyValueStore/warnIfLegacyJsonKvsStores';
import {
  apiImplementation,
  awaitQueueIdle,
  createTinkerInterface,
  eventBusImplementation,
  fileStorageImplementation,
  fileWatcherImplementation,
  kvsStreamImplementation,
  queueImplementation,
  serviceFunctionImplementation,
  webSocketImplementation,
} from './implementations';
import { DevServerConfig, DevServerConfigOverrides, ResolvedDevServerConfig, TinkerInterface, TinkerOptions } from './types';

export * from './implementations';

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

// Checkpoint the kvs WAL on the way out (SIGINT from a terminal, SIGTERM from
// docker). Durability never needs this - sqlite commits at the statement - it
// just folds kvs.db-wal back into kvs.db so a stopped server leaves one file.
const closeKvsRepositoriesAndExit = (): void => {
  void closeAllKvsRepositories().finally(() => process.exit(0));
};

export const startDevServer = async (devServerConfig: DevServerConfig, devServerConfigOverrides?: DevServerConfigOverrides) => {
  console.log('Starting QPQ Dev Server!!! - this is a note');

  const resolvedDevServerConfig = resolveDevServerConfig(devServerConfig, devServerConfigOverrides);

  warnIfLegacyJsonKvsStores(resolvedDevServerConfig.runtimePath);

  process.once('SIGINT', closeKvsRepositoriesAndExit);
  process.once('SIGTERM', closeKvsRepositoriesAndExit);

  await Promise.all([
    apiImplementation(resolvedDevServerConfig),

    serviceFunctionImplementation(resolvedDevServerConfig),

    eventBusImplementation(resolvedDevServerConfig),

    kvsStreamImplementation(resolvedDevServerConfig),
    queueImplementation(resolvedDevServerConfig),

    webSocketImplementation(resolvedDevServerConfig),

    fileStorageImplementation(resolvedDevServerConfig),
    fileWatcherImplementation(resolvedDevServerConfig),
  ]);
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

  // The queue is what actually executes a migration, and the kvs stream keeps projections in
  // step with whatever it writes. Nothing else is needed: no http server, no websockets.
  // NOT awaited: these block forever by design (startDevServer runs them inside Promise.all
  // alongside the http server). Awaiting one hangs the whole command silently.
  void queueImplementation(resolvedDevServerConfig);
  void kvsStreamImplementation(resolvedDevServerConfig);

  // Let them register their bus listeners before anything is published, exactly as
  // startTinker does.
  await new Promise((resolve) => setTimeout(resolve, 100));

  const tinker = createTinkerInterface(resolvedDevServerConfig);
  const ran: Record<string, string[]> = {};

  for (const serviceName of tinker.getServices()) {
    tinker.switchService(serviceName);

    const result = await tinker.run(askRunPendingMigrations);

    if (result.error) {
      throw new Error(`Migration failed for service [${serviceName}]: ${result.error.errorText}`);
    }

    // Enqueueing is not running: wait for the handlers themselves before calling this service
    // done, or a failure would surface after we had already reported success.
    await awaitQueueIdle();

    ran[serviceName] = result.result ?? [];
  }

  // Sqlite commits at the statement, so every migration write is already on
  // disk; closing just checkpoints the WAL before the one-shot process exits.
  await closeAllKvsRepositories();

  return ran;
};

export const startTinker = async (
  devServerConfig: DevServerConfig,
  devServerConfigOverrides?: DevServerConfigOverrides,
  tinkerOptions?: TinkerOptions,
): Promise<TinkerInterface> => {
  console.log('Starting QPQ Tinker Environment...');

  const resolvedDevServerConfig = resolveDevServerConfig(devServerConfig, devServerConfigOverrides);

  // Start all implementations without awaiting (they run forever)
  // Just fire them off in the background
  if (tinkerOptions?.includeHttpServer) {
    apiImplementation(resolvedDevServerConfig);
  }

  serviceFunctionImplementation(resolvedDevServerConfig);
  eventBusImplementation(resolvedDevServerConfig);
  kvsStreamImplementation(resolvedDevServerConfig);
  queueImplementation(resolvedDevServerConfig);
  webSocketImplementation(resolvedDevServerConfig);
  fileStorageImplementation(resolvedDevServerConfig);
  fileWatcherImplementation(resolvedDevServerConfig);

  // Give implementations a moment to initialize
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Create and return the tinker interface
  return createTinkerInterface(resolvedDevServerConfig, tinkerOptions);
};
