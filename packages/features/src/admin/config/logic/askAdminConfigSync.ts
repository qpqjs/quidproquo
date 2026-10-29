import { askConfigGetApplicationInfo, askConfigListParameters, askMapParallelBatch, AskResponse, askRunParallel } from '@qpqjs/core';

import { askWebsocketConnectionInfoRead } from '../../../webSocketQueue/context';
import { ADMIN_CONFIG_SYNC_BATCH_SIZE } from '../../constants';
import { AdminConfigSyncTarget, askAdminConfigSyncSendParameter } from './askAdminConfigSyncSendParameter';

// Sends every parameter of this service to the admin client that asked, in batches.
export function* askAdminConfigSync(): AskResponse<void> {
  const [params, { connectionId, correlationId }, { module }] = yield* askRunParallel([
    askConfigListParameters(),
    askWebsocketConnectionInfoRead(),
    askConfigGetApplicationInfo(),
  ]);

  const target: AdminConfigSyncTarget = { connectionId, correlationId, service: module };

  yield* askMapParallelBatch(params, ADMIN_CONFIG_SYNC_BATCH_SIZE, function* askSendParameter(param: string) {
    yield* askAdminConfigSyncSendParameter(param, target);
  });
}
