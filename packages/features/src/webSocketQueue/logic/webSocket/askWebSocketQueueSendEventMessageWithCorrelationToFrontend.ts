import { AskResponse } from '@qpqjs/core';

import { askWebsocketConnectionInfoRead } from '../../context';
import { webSocketConnectionData } from '../../data';
import { AnyWebSocketQueueEventMessageWithCorrelation } from '../../types';
import { AnyWebSocketQueueEventMessage } from '../../types/AnyWebSocketQueueEventMessage';
import { askWebSocketQueueSendToConnectionCleaningUpStale } from './askWebSocketQueueSendToConnectionCleaningUpStale';

export type askSendMessageToFrontendArgs = {
  userId?: string;
  connectionId?: string;
  payload: AnyWebSocketQueueEventMessage;
};

function* askSendMessageToEveryone(payload: AnyWebSocketQueueEventMessageWithCorrelation) {
  const connections = yield* webSocketConnectionData.askConnectionGetAll();

  for (const connection of connections) {
    yield* askWebSocketQueueSendToConnectionCleaningUpStale(connection.id, payload);
  }
}

function* askSendMessageToUser(userId: string, payload: AnyWebSocketQueueEventMessageWithCorrelation) {
  const connections = yield* webSocketConnectionData.askConnectionGetByUserId(userId);

  for (const connection of connections) {
    yield* askWebSocketQueueSendToConnectionCleaningUpStale(connection.id, payload);
  }
}

export function* askWebSocketQueueSendEventMessageWithCorrelationToFrontend(
  payload: AnyWebSocketQueueEventMessageWithCorrelation,
  connectionId?: string,
  userId?: string,
): AskResponse<void> {
  // add the correlation id to the response if we have one.
  const payloadWithCorrelationId = { ...payload };

  if (!payloadWithCorrelationId.correlationId) {
    const { correlationId } = yield* askWebsocketConnectionInfoRead();

    payloadWithCorrelationId.correlationId = correlationId;
  }

  if (connectionId) {
    const sent = yield* askWebSocketQueueSendToConnectionCleaningUpStale(connectionId, payloadWithCorrelationId);

    // If we sent the message, or we don't have a direct user to send it to, bail
    if (sent || !userId) {
      return;
    }
  }

  if (userId) {
    yield* askSendMessageToUser(userId, payloadWithCorrelationId);
  } else {
    yield* askSendMessageToEveryone(payloadWithCorrelationId);
  }
}
