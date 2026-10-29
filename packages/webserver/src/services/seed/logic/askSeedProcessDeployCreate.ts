import {
  askConfigGetGlobal,
  askQueueSendMessages,
  AskResponse,
  getUniqueKeyFromQpqFunctionRuntime,
  QpqFunctionRuntime,
  QueueMessage,
} from '@qpqjs/core';

import { QPQ_SEEDS_RESOURCE_NAME } from '../../../config/constants';

export function* askSeedProcessDeployCreate(): AskResponse<void> {
  const allSeeds = yield* askConfigGetGlobal<QpqFunctionRuntime[]>(QPQ_SEEDS_RESOURCE_NAME);

  // For each seed, send a message to the queue to run the seed script
  for (const seed of allSeeds) {
    const message: QueueMessage<undefined> = {
      type: getUniqueKeyFromQpqFunctionRuntime(seed),
      payload: undefined,
    };

    yield* askQueueSendMessages(QPQ_SEEDS_RESOURCE_NAME, message);
  }
}
