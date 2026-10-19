import { AskResponse } from 'quidproquo-core';

import { askWebsocketReadConnectionInfo } from '../../context';
import { webSocketConnectionData } from '../../data';
import { AnyWebSocketQueueEventMessageWithCorrelation } from '../../types';
import { AnyWebSocketQueueEventMessage } from '../../types/AnyWebSocketQueueEventMessage';
import { askSendToConnectionCleaningUpStale } from './askSendToConnectionCleaningUpStale';

export type askSendMessageToFrontendArgs = {
  userId?: string;
  connectionId?: string;
  payload: AnyWebSocketQueueEventMessage;
};

function* askSendMessageToEveryone(payload: AnyWebSocketQueueEventMessageWithCorrelation) {
  const connections = yield* webSocketConnectionData.askGetAllConnections();

  for (const connection of connections) {
    yield* askSendToConnectionCleaningUpStale(connection.id, payload);
  }
}

function* askSendMessageToUser(userId: string, payload: AnyWebSocketQueueEventMessageWithCorrelation) {
  const connections = yield* webSocketConnectionData.askGetConnectionsByUserId(userId);

  for (const connection of connections) {
    yield* askSendToConnectionCleaningUpStale(connection.id, payload);
  }
}

export function* askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend(
  payload: AnyWebSocketQueueEventMessageWithCorrelation,
  connectionId?: string,
  userId?: string,
): AskResponse<void> {
  // add the correlation id to the response if we have one.
  const payloadWithCorrelationId = { ...payload };

  if (!payloadWithCorrelationId.correlationId) {
    const { correlationId } = yield* askWebsocketReadConnectionInfo();

    payloadWithCorrelationId.correlationId = correlationId;
  }

  if (connectionId) {
    const sent = yield* askSendToConnectionCleaningUpStale(connectionId, payloadWithCorrelationId);

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
