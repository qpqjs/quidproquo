import { buildTestQpqConfig, ErrorTypeEnum, EventActionType } from 'quidproquo-core';
import { QPQWebServerConfigSettingType, WebSocketEventType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { resolveEventProcessor } from '../../../../../testing/eventProcessorTestHelpers';
import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const eventProcessors = { onConnect: 'connectRt', onDisconnect: 'disconnectRt', onMessage: 'messageRt' };

// GLOBAL_WEBSOCKET_API_NAME is read from process.env at import time and is undefined in tests,
// so the matching websocket setting also uses an undefined apiName.
const websocketConfig = buildTestQpqConfig([
  { configSettingType: QPQWebServerConfigSettingType.WebSocket, apiName: undefined, eventProcessors } as any,
]);

describe('apiGatwayEvent/websocket getEventGetRecordsActionProcessor', () => {
  it('maps a websocket request context to an internal record', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = {
      body: 'hello',
      requestContext: {
        eventType: 'MESSAGE',
        messageId: 'm1',
        connectionId: 'c1',
        requestTimeEpoch: 0,
        identity: { sourceIp: '1.2.3.4', userAgent: 'agent' },
      },
    };

    const [records] = await processor({ eventParams: [event, {}] });

    expect(records).toEqual([
      {
        eventType: WebSocketEventType.Message,
        messageId: 'm1',
        connectionId: 'c1',
        requestTimeEpoch: 0,
        sourceIp: '1.2.3.4',
        userAgent: 'agent',
        requestTime: new Date(0).toISOString(),
        body: 'hello',
        apiName: undefined,
      },
    ]);
  });
});

describe('apiGatwayEvent/websocket getEventMatchStoryActionProcessor', () => {
  it.each([
    [WebSocketEventType.Connect, eventProcessors.onConnect],
    [WebSocketEventType.Disconnect, eventProcessors.onDisconnect],
    [WebSocketEventType.Message, eventProcessors.onMessage],
  ])('routes the %s event to its configured processor', async (eventType: WebSocketEventType, runtime: string) => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, websocketConfig);

    const [match] = await processor({ qpqEventRecord: { eventType } });

    expect((match as any).runtime).toBe(runtime);
  });

  it('returns a NotFound error for an unknown event type', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, websocketConfig);

    const [, error] = await processor({ qpqEventRecord: { eventType: 'OTHER' } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });
});

describe('apiGatwayEvent/websocket getEventTransformResponseResultActionProcessor', () => {
  it('returns a 200 status code when every record succeeded', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [response] = await processor({ eventParams: [{}, {}], qpqEventRecordResponses: [{ success: true, result: {} }] });

    expect(response).toEqual({ statusCode: 200 });
  });
});

describe('apiGatwayEvent/websocket auto respond and story session', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });

  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [{}, {}] })).toEqual([undefined]);
  });
});
