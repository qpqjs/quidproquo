import { askConfigGetParameter, AskResponse } from '@qpqjs/core';

import { askWebSocketQueueSendEventMessageWithCorrelationToFrontend } from '../../../webSocketQueue/logic/webSocket/askWebSocketQueueSendEventMessageWithCorrelationToFrontend';
import {
  AdminSettingDataType,
  AdminSettingFieldType,
  WebSocketQueueQpqAdminServerEventMessageModifySetting,
  WebSocketQueueQpqAdminServerMessageEventType,
} from '../../log/logic/webSocket';

export type AdminConfigSyncTarget = {
  // The websocket connection that asked, as the connection-info context holds it.
  connectionId?: string;
  correlationId?: string;
  // The service whose settings these are, shown beside each one.
  service: string;
};

// Reads one parameter and shows it on the admin client as an editable setting.
export function* askAdminConfigSyncSendParameter(param: string, target: AdminConfigSyncTarget): AskResponse<void> {
  const value = yield* askConfigGetParameter(param);

  const message: WebSocketQueueQpqAdminServerEventMessageModifySetting = {
    type: WebSocketQueueQpqAdminServerMessageEventType.ModifySetting,
    payload: {
      fieldType: AdminSettingFieldType.TextBox,
      dataType: AdminSettingDataType.Parameter,
      label: `${param}`,
      tooltip: `Parameter ${param}`,
      value,
      service: target.service,
    },
  };

  yield* askWebSocketQueueSendEventMessageWithCorrelationToFrontend({ ...message, correlationId: target.correlationId }, target.connectionId);
}
