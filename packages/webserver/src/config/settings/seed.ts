import { defineDeployEvent, defineGlobal, defineQueue, getUniqueKeyFromQpqFunctionRuntime, QPQConfig, QpqFunctionRuntime } from 'quidproquo-core';

import { getServiceEntryQpqFunctionRuntime } from '../../services/getServiceEntryQpqFunctionRuntime';

export const defineSeed = (seeds: QpqFunctionRuntime[]): QPQConfig => {
  return [
    // Define a global so we can access the seeds from the src
    defineGlobal('qpqSeeds', seeds),

    // Listen to deploy events
    defineDeployEvent('qpqSeeds', getServiceEntryQpqFunctionRuntime('seed', 'deployEvent', 'onDeploy::onDeploy')),

    // Build up a queue where the src names are the event types
    defineQueue(
      'qpqSeeds',
      seeds.reduce(
        (acc, s) => ({
          ...acc,
          [getUniqueKeyFromQpqFunctionRuntime(s)]: s,
        }),
        {},
      ),
      {
        maxConcurrentExecutions: 1,
        batchSize: 1,
        concurrency: 1,
      },
    ),
  ];
};
