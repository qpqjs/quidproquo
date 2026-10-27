import {
  defineDeployEvent,
  defineGlobal,
  defineKeyValueStore,
  defineQueue,
  DeployEventType,
  isQpqFunctionRuntimeAdvanced,
  QPQConfig,
  QPQConfigAdvancedSettings,
  QpqFunctionRuntime,
} from 'quidproquo-core';

import { getServiceEntryQpqFunctionRuntime } from '../../services/getServiceEntryQpqFunctionRuntime';

export interface Migration {
  runtime: QpqFunctionRuntime;
  deployType: DeployEventType;
}

export interface QPQConfigAdvancedMigrationSettings extends QPQConfigAdvancedSettings {}

function removeLeadingSlashs(text: string): string {
  if (text.startsWith('/')) {
    return removeLeadingSlashs(text.slice(1));
  }

  return text;
}

export function getQpqMigrationQueueTypeFromQpqFunctionRuntime(qpqFunctionRuntime: QpqFunctionRuntime): string {
  if (isQpqFunctionRuntimeAdvanced(qpqFunctionRuntime)) {
    return `${qpqFunctionRuntime.basePath}/${removeLeadingSlashs(qpqFunctionRuntime.relativePath)}`;
  }

  const [srcPath] = qpqFunctionRuntime.split('::');
  return removeLeadingSlashs(srcPath);
}

export const defineMigration = (migrations: Migration[], options?: QPQConfigAdvancedMigrationSettings): QPQConfig => {
  return [
    // Define a global so we can access the migrations from the src
    defineGlobal('qpqMigrations', migrations),

    // Create a kvs so we can track which migrations have been run
    defineKeyValueStore('qpqMigrations', 'srcPath', ['deployType'], options),

    // Listen to deploy events
    defineDeployEvent('qpqMigrations', getServiceEntryQpqFunctionRuntime('migration', 'deployEvent', 'onDeploy::onDeploy')),

    // Build up a queue where the src names are the event types
    defineQueue(
      'qpqMigrations',
      migrations.reduce(
        (acc, m) => ({
          ...acc,
          [getQpqMigrationQueueTypeFromQpqFunctionRuntime(m.runtime)]: m.runtime,
        }),
        {},
      ),
      {
        ...options,
        maxConcurrentExecutions: 1,
        batchSize: 1,
        concurrency: 1,
      },
    ),
  ];
};
