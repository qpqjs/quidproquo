import {
  askConfigGetApplicationInfo,
  askConfigGetParameter,
  askConfigListParameters,
  askMapParallelBatch,
  AskResponse,
  askRunParallel,
  QueueEventResponse,
} from '@qpqjs/core';

import { askWebsocketConnectionInfoRead } from '../../../../webSocketQueue/context';
import { askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend } from '../../../../webSocketQueue/logic/webSocket/askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend';
import { ADMIN_CONFIG_SYNC_BATCH_SIZE } from '../../../constants';
import {
  AdminSettingDataType,
  AdminSettingFieldType,
  WebSocketQueueQpqAdminConfigSyncRequestQueueEvent,
  WebSocketQueueQpqAdminServerEventMessageModifySetting,
  WebSocketQueueQpqAdminServerMessageEventType,
} from '../../../log/logic/webSocket';

export function* onConfigSyncRequest(event: WebSocketQueueQpqAdminConfigSyncRequestQueueEvent): AskResponse<QueueEventResponse> {
  const [params, { connectionId, correlationId }, { module }] = yield* askRunParallel([
    askConfigListParameters(),
    askWebsocketConnectionInfoRead(),
    askConfigGetApplicationInfo(),
  ]);

  yield* askMapParallelBatch(params, ADMIN_CONFIG_SYNC_BATCH_SIZE, function* askSendMessageToFrontend(param: string) {
    const value = yield* askConfigGetParameter(param);

    const logMessage: WebSocketQueueQpqAdminServerEventMessageModifySetting = {
      type: WebSocketQueueQpqAdminServerMessageEventType.ModifySetting,
      payload: {
        fieldType: AdminSettingFieldType.TextBox,
        dataType: AdminSettingDataType.Parameter,
        label: `${param}`,
        tooltip: `Parameter ${param}`,
        value: value,
        service: module,
      },
    };

    yield* askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend(
      {
        ...logMessage,
        correlationId,
      },
      connectionId,
    );
  });

  return true;
}
