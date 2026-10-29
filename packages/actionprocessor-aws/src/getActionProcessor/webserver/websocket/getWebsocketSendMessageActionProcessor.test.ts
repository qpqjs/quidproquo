import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';
import { askWebsocketSendMessageBase, defineWebsocket, WebsocketActionType } from '@qpqjs/webserver';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendMessageToWebSocketConnection } from '../../../logic/apiGateway/sendMessageToWebSocketConnection';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { getWebsocketSendMessageActionProcessor } from './getWebsocketSendMessageActionProcessor';

vi.mock('../../../logic/apiGateway/sendMessageToWebSocketConnection', () => ({
  sendMessageToWebSocketConnection: vi.fn(),
}));
vi.mock('../../../logic/cloudformation/getExportedValue', () => ({
  getExportedValue: vi.fn(),
}));

const websocketEventProcessors = { onConnect: undefined, onDisconnect: undefined } as any;

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineWebsocket('ws', websocketEventProcessors)]);
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

  // Security regression: the payload goes out exactly as given (no session or token rides along), and a refusal from
  // API Gateway for a connection this api does not own is a typed error, never a throw out of the processor.
  it('sends only the given payload and maps a forbidden connection to a typed error', async () => {
    const processor = await resolveProcessor();
    await invoke(processor);
    expect(vi.mocked(sendMessageToWebSocketConnection).mock.calls[0][3]).toEqual({ hi: true });

    vi.mocked(sendMessageToWebSocketConnection).mockRejectedValue(Object.assign(new Error('forbidden'), { name: 'ForbiddenException' }));
    const [, error] = await invoke(processor);

    expect(error?.errorType).toBeDefined();
    expect(error?.errorText).not.toContain('forbidden');
  });

  it('maps a gone connection to a disconnected error', async () => {
    vi.mocked(sendMessageToWebSocketConnection).mockRejectedValue(Object.assign(new Error('gone'), { name: 'GoneException' }));
    const processor = await resolveProcessor();

    const [, error] = await invoke(processor);

    expect(error?.errorType).toBe(askWebsocketSendMessageBase.errorType.Disconnected);
  });
});
