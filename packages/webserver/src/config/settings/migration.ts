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
} from '@qpqjs/core';

import { getServiceEntryQpqFunctionRuntime } from '../../services/getServiceEntryQpqFunctionRuntime';
import { QPQ_MIGRATIONS_RESOURCE_NAME } from '../constants';

export type Migration = {
  runtime: QpqFunctionRuntime;
  deployType: DeployEventType;
};

export type QPQConfigAdvancedMigrationSettings = {} & QPQConfigAdvancedSettings;

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

  const [srcPath = ''] = qpqFunctionRuntime.split('::');
  return removeLeadingSlashs(srcPath);
}

export const defineMigration = (migrations: Migration[], options?: QPQConfigAdvancedMigrationSettings): QPQConfig => {
  return [
    // Define a global so we can access the migrations from the src
    defineGlobal(QPQ_MIGRATIONS_RESOURCE_NAME, migrations),

    // Create a kvs so we can track which migrations have been run
    defineKeyValueStore(QPQ_MIGRATIONS_RESOURCE_NAME, 'srcPath', ['deployType'], options),

    // Listen to deploy events
    defineDeployEvent(QPQ_MIGRATIONS_RESOURCE_NAME, getServiceEntryQpqFunctionRuntime('migration', 'deployEvent', 'onDeploy::onDeploy')),

    // Build up a queue where the src names are the event types
    defineQueue(
      QPQ_MIGRATIONS_RESOURCE_NAME,
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
