import {
  ActionProcessorResult,
  EventActionType,
  isErroredActionResult,
  QpqRuntimeType,
  resolveActionResult,
  resolveActionResultError,
  StoryResult,
} from 'quidproquo-core';
import { WebsocketEvent, WebSocketEventType } from 'quidproquo-webserver';

export const webSocketEventGenericTextExtractor = (storyResult: StoryResult<any>): string[] => {
  if (storyResult.runtimeType === QpqRuntimeType.WEBSOCKET_EVENT) {
    const getRecordsHistory = storyResult.history.find((h) => h.act.type === EventActionType.GetRecords);

    if (!getRecordsHistory) {
      return [`no ${EventActionType.GetRecords}`];
    }

    const actionResult: ActionProcessorResult<WebsocketEvent[]> = getRecordsHistory.res;

    if (!isErroredActionResult(actionResult)) {
      const webSocketEvents = resolveActionResult(actionResult);
      return webSocketEvents.flatMap((event) => {
        const connectionId = event.connectionId || 'unknown';
        const ip = event.sourceIp || 'unknown';
        const eventType = event.eventType || 'unknown';
        const customMessage = JSON.parse(event.body || '{}');

        const messageType =
          event.eventType === WebSocketEventType.Message ? '::' + (customMessage.type || customMessage.messageType || 'unknown') : '';

        return `${eventType}${messageType} ${connectionId} ${ip}`;
      });
    }

    return [resolveActionResultError(actionResult).errorText];
  }

  return [''];
};
