import { defineDeployEvent, defineGlobal, defineQueue, getUniqueKeyFromQpqFunctionRuntime, QPQConfig, QpqFunctionRuntime } from '@qpqjs/core';

import { getServiceEntryQpqFunctionRuntime } from '../../services/getServiceEntryQpqFunctionRuntime';
import { QPQ_SEEDS_RESOURCE_NAME } from '../constants';

export const defineSeed = (seeds: QpqFunctionRuntime[]): QPQConfig => {
  return [
    // Define a global so we can access the seeds from the src
    defineGlobal(QPQ_SEEDS_RESOURCE_NAME, seeds),

    // Listen to deploy events
    defineDeployEvent(QPQ_SEEDS_RESOURCE_NAME, getServiceEntryQpqFunctionRuntime('seed', 'deployEvent', 'onDeploy::onDeploy')),

    // Build up a queue where the src names are the event types
    defineQueue(
      QPQ_SEEDS_RESOURCE_NAME,
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
