import { getEventAutoRespondNoopActionProcessor as getEventAutoRespondActionProcessor } from '@qpqjs/actionprocessor-js';
import { getEventGetStorySessionNoopActionProcessor as getEventGetStorySessionActionProcessor } from '@qpqjs/actionprocessor-js';
import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { QPQWebServerConfigSettingType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

const eventProcessors = { onConnect: 'connectRt', onDisconnect: 'disconnectRt', onMessage: 'messageRt' };

// GLOBAL_WEBSOCKET_API_NAME is read from process.env at import time and is undefined in tests,
// so the matching websocket setting also uses an undefined apiName.
const websocketConfig = buildTestQpqConfig([
  { configSettingType: QPQWebServerConfigSettingType.WebSocket, apiName: undefined, eventProcessors } as any,
]);

describe('websocket getApiGatewayWebsocketEventEventProcessor', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });
});
describe('websocket getApiGatewayWebsocketEventEventProcessor', () => {
  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [{}, {}] })).toEqual([undefined]);
  });
});
