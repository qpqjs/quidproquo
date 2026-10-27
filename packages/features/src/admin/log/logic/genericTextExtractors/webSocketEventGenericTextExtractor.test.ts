import { actionResult, actionResultError, ErrorTypeEnum, EventActionType, QpqRuntimeType } from 'quidproquo-core';
import { WebsocketEvent, WebSocketEventType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { getRecordsHistory, makeStoryResultBuilder } from '../../testing/genericTextExtractorTestHelpers';
import { webSocketEventGenericTextExtractor } from './webSocketEventGenericTextExtractor';

const buildStoryResult = makeStoryResultBuilder(QpqRuntimeType.WEBSOCKET_EVENT);

const wsEvent = (overrides: Partial<WebsocketEvent>): WebsocketEvent =>
  ({
    eventType: WebSocketEventType.Connect,
    connectionId: 'conn-1',
    sourceIp: '1.2.3.4',
    ...overrides,
  }) as WebsocketEvent;

describe('webSocketEventGenericTextExtractor', () => {
  it('describes a connect event without a message type', () => {
    const result = webSocketEventGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResult([wsEvent({ eventType: WebSocketEventType.Connect })]))],
      }),
    );

    expect(result).toEqual(['CONNECT conn-1 1.2.3.4']);
  });

  it('includes the message type for a message event from the body type field', () => {
    const result = webSocketEventGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResult([wsEvent({ eventType: WebSocketEventType.Message, body: JSON.stringify({ type: 'chat' }) })]))],
      }),
    );

    expect(result).toEqual(['MESSAGE::chat conn-1 1.2.3.4']);
  });

  it('falls back to unknown for missing connection details and message type', () => {
    const result = webSocketEventGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResult([{ eventType: WebSocketEventType.Message } as WebsocketEvent]))],
      }),
    );

    expect(result).toEqual(['MESSAGE::unknown unknown unknown']);
  });

  it('returns the error text when the get records action errored', () => {
    const result = webSocketEventGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResultError(ErrorTypeEnum.GenericError, 'boom'))],
      }),
    );

    expect(result).toEqual(['boom']);
  });

  it('reports the missing get records action when there is no matching history', () => {
    expect(webSocketEventGenericTextExtractor(buildStoryResult({ history: [] }))).toEqual([`no ${EventActionType.GetRecords}`]);
  });

  it('returns a single empty string for a non-websocket runtime', () => {
    expect(webSocketEventGenericTextExtractor(buildStoryResult({ runtimeType: QpqRuntimeType.API }))).toEqual(['']);
  });
});
