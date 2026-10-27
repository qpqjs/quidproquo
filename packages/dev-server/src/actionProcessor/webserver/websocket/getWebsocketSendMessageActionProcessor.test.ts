import { buildTestQpqConfig, isErroredActionResult, resolveActionResult } from 'quidproquo-core';
import { defineWebsocket, WebsocketActionType } from 'quidproquo-webserver';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendMessageToWebSocketConnection } from '../../../implementations/webSocket/webSocketConnectionRegistry';
import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getWebsocketSendMessageActionProcessor } from './getWebsocketSendMessageActionProcessor';

vi.mock('../../../implementations/webSocket/webSocketConnectionRegistry', () => ({
  sendMessageToWebSocketConnection: vi.fn(),
}));

const websocketApiName = 'api';
const buildConfig = () => buildTestQpqConfig([defineWebsocket('ws', 'example.com', {}, { apiName: websocketApiName })]);

const getProcessor = async () => {
  const processors = await getWebsocketSendMessageActionProcessor(buildConfig(), {} as any);
  return processors[WebsocketActionType.SendMessage];
};

describe('getWebsocketSendMessageActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('forwards (service, websocketApiName, connectionId, payload) and returns success undefined', async () => {
    const process = await getProcessor();

    const result = await invokeProcessor(process, { connectionId: 'conn-1', payload: { hi: true }, websocketApiName });

    expect(resolveActionResult(result)).toBeUndefined();
    expect(sendMessageToWebSocketConnection).toHaveBeenCalledWith('test-module', websocketApiName, 'conn-1', { hi: true });
  });

  it('returns an errored result when sending throws', async () => {
    (sendMessageToWebSocketConnection as any).mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { connectionId: 'conn-1', payload: {}, websocketApiName });

    expect(isErroredActionResult(result)).toBe(true);
  });
});
