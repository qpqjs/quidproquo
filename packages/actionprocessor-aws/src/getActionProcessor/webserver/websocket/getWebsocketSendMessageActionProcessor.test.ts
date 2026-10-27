import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, createActionProcessor, ProcessorFor } from 'quidproquo-core';
import { askWebsocketSendMessageBase, defineWebsocket, WebsocketActionType } from 'quidproquo-webserver';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendMessageToWebSocketConnection } from '../../../logic/apiGateway/sendMessageToWebSocketConnection';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getWebsocketSendMessageActionProcessor } from './getWebsocketSendMessageActionProcessor';

vi.mock('../../../logic/apiGateway/sendMessageToWebSocketConnection', () => ({
  sendMessageToWebSocketConnection: vi.fn(),
}));
vi.mock('../../../logic/cloudformation/getExportedValue', () => ({
  getExportedValue: vi.fn(),
}));

const websocketEventProcessors = { onConnect: undefined, onDisconnect: undefined } as any;

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([
    defineAwsServiceAccountInfo('111', 'eu-west-1'),
    defineWebsocket('ws', 'example.com', websocketEventProcessors),
  ]);
  const processors = await getWebsocketSendMessageActionProcessor(config, {} as any);
  return processors[WebsocketActionType.SendMessage];
};

const invoke = (processor: any) => invokeProcessor(processor, { connectionId: 'c1', payload: { hi: true }, websocketApiName: 'api' });

describe('getWebsocketSendMessageActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(sendMessageToWebSocketConnection).mockReset();
    vi.mocked(getExportedValue).mockReset();
    vi.mocked(getExportedValue).mockResolvedValue('API123');
  });

  it('sends the payload to the resolved websocket api connection', async () => {
    const processor = await resolveProcessor();

    const result = await invoke(processor);

    expect(result).toEqual([undefined]);
    expect(sendMessageToWebSocketConnection).toHaveBeenCalledWith('API123', 'c1', 'eu-west-1', { hi: true });
  });

  it('maps a gone connection to a disconnected error', async () => {
    vi.mocked(sendMessageToWebSocketConnection).mockRejectedValue(Object.assign(new Error('gone'), { name: 'GoneException' }));
    const processor = await resolveProcessor();

    const [, error] = await invoke(processor);

    expect(error?.errorType).toBe(askWebsocketSendMessageBase.errorType.Disconnected);
  });
});
