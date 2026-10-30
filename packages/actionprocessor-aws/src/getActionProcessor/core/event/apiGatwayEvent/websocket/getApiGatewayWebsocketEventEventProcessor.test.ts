import { getEventAutoRespondNoopActionProcessor as getEventAutoRespondActionProcessor } from '@qpqjs/actionprocessor-js';
import { getEventGetStorySessionNoopActionProcessor as getEventGetStorySessionActionProcessor } from '@qpqjs/actionprocessor-js';
import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { QPQWebServerConfigSettingType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getApiGatewayWebsocketEventEventProcessor } from './getApiGatewayWebsocketEventEventProcessor';

const eventProcessors = { onConnect: 'connectRt', onDisconnect: 'disconnectRt', onMessage: 'messageRt' };

const websocketConfig = buildTestQpqConfig([{ configSettingType: QPQWebServerConfigSettingType.WebSocket, apiName: 'ws', eventProcessors } as any]);

describe('websocket getApiGatewayWebsocketEventEventProcessor', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });
});
describe('websocket getApiGatewayWebsocketEventEventProcessor', () => {
  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [{}, {}] })).toEqual([null]);
  });
});

describe('apiGatwayEvent/websocket getApiGatewayWebsocketEventEventProcessor', () => {
  it('composes a processor for every event action for the api the handler names', async () => {
    const processors = await getApiGatewayWebsocketEventEventProcessor('ws')(websocketConfig, null as any);

    expect(Object.keys(processors).sort()).toEqual(
      [
        EventActionType.AutoRespond,
        EventActionType.GetRecords,
        EventActionType.GetStorySession,
        EventActionType.MatchStory,
        EventActionType.TransformResponseResult,
      ].sort(),
    );
  });
});
