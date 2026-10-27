import {
  askConfigGetGlobal,
  askQueueSendMessages,
  AskResponse,
  DeployEventStatusType,
  DeployEventType,
  getUniqueKeyFromQpqFunctionRuntime,
  QpqFunctionRuntime,
  QueueMessage,
} from '@qpqjs/core';

export function* askProcessOnDeployCreate(): AskResponse<void> {
  const allSeeds = yield* askConfigGetGlobal<QpqFunctionRuntime[]>('qpqSeeds');

  // For each seed, send a message to the queue to run the seed script
  for (const seed of allSeeds) {
    // Send a message to the queue to run the migration.
    const message: QueueMessage<undefined> = {
      type: getUniqueKeyFromQpqFunctionRuntime(seed),
      payload: undefined,
    };

    yield* askQueueSendMessages('qpqSeeds', message);
  }
}

// Seeds run once, when this service's own api stack is first created. The deploy rule
// delivers every stack status change in the account, so the deploy type has to be
// checked too: a stranger's or the web stack's CREATE_COMPLETE must not re-seed.
export function* onDeploy(deployEventType: DeployEventType, deployEventStatusType: DeployEventStatusType): AskResponse<void> {
  if (deployEventType === DeployEventType.Api && deployEventStatusType === DeployEventStatusType.Create) {
    yield* askProcessOnDeployCreate();
  }
}
