import { isErroredActionResult, resolveActionResult, resolveActionResultError } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';
import { askWebsocketSendMessageBase, defineWebsocket, WebsocketActionType } from '@qpqjs/webserver';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendMessageToWebSocketConnection } from '../../../implementations/webSocket/webSocketConnectionRegistry';
import { getWebsocketSendMessageActionProcessor } from './getWebsocketSendMessageActionProcessor';

vi.mock('../../../implementations/webSocket/webSocketConnectionRegistry', () => ({
  sendMessageToWebSocketConnection: vi.fn(),
}));

const websocketApiName = 'api';
const buildConfig = () => buildTestQpqConfig([defineWebsocket('ws', {} as any, { apiName: websocketApiName })]);

const getProcessor = async () => {
  const processors = await getWebsocketSendMessageActionProcessor(buildConfig(), {} as any);
  return processors[WebsocketActionType.SendMessage];
};

describe('getWebsocketSendMessageActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('forwards (service, websocketApiName, connectionId, payload) and returns success undefined', async () => {
    (sendMessageToWebSocketConnection as any).mockResolvedValue(true);
    const process = await getProcessor();

    const result = await invokeProcessor(process!, { connectionId: 'conn-1', payload: { hi: true }, websocketApiName });

    expect(resolveActionResult(result)).toBeUndefined();
    expect(sendMessageToWebSocketConnection).toHaveBeenCalledWith('test-module', websocketApiName, 'conn-1', { hi: true });
  });

  it('answers Disconnected when the connection is no longer registered, as AWS does', async () => {
    (sendMessageToWebSocketConnection as any).mockResolvedValue(false);
    const process = await getProcessor();

    const result = await invokeProcessor(process!, { connectionId: 'gone', payload: {}, websocketApiName });

    expect(resolveActionResultError(result).errorType).toBe(askWebsocketSendMessageBase.errorType.Disconnected);
  });

  it('returns an errored result when sending throws', async () => {
    (sendMessageToWebSocketConnection as any).mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process!, { connectionId: 'conn-1', payload: {}, websocketApiName });

    expect(isErroredActionResult(result)).toBe(true);
  });
});
