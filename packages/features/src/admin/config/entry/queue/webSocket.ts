import {
  askConfigGetApplicationInfo,
  askConfigGetParameter,
  askConfigListParameters,
  askMapParallelBatch,
  AskResponse,
  askRunParallel,
  QueueEventResponse,
} from 'quidproquo-core';

import { askWebsocketReadConnectionInfo } from '../../../../webSocketQueue/context';
import { askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend } from '../../../../webSocketQueue/logic/webSocket/askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend';
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
    askWebsocketReadConnectionInfo(),
    askConfigGetApplicationInfo(),
  ]);

  yield* askMapParallelBatch(params, 5, function* askSendMessageToFrontend(param: string) {
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
