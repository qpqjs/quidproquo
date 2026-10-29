import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { QPQWebServerConfigSettingType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const eventProcessors = { onConnect: 'connectRt', onDisconnect: 'disconnectRt', onMessage: 'messageRt' };

const websocketConfig = buildTestQpqConfig([{ configSettingType: QPQWebServerConfigSettingType.WebSocket, apiName: 'ws', eventProcessors } as any]);

describe('apiGatwayEvent/websocket getEventTransformResponseResultActionProcessor', () => {
  it('returns a 200 status code when every record succeeded', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    const [response] = await processor({ eventParams: [{}, {}], qpqEventRecordResponses: [{ success: true, result: {} }] });

    expect(response).toEqual({ statusCode: 200 });
  });
});
