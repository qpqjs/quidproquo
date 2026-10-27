import {
  buildTestQpqConfig,
  ErrorTypeEnum,
  EventActionType,
  isErroredActionResult,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';
import { defineWebsocket, WebSocketEventType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../../../testing/testProcessorRuntime';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const onConnect = '/entry::onConnect' as const;
const onDisconnect = '/entry::onDisconnect' as const;
const onMessage = '/entry::onMessage' as const;

const buildConfig = () => buildTestQpqConfig([defineWebsocket('ws', { onConnect, onDisconnect, onMessage })]);

const invoke = async (eventType: string) => {
  const processors = await getEventMatchStoryActionProcessor(buildConfig(), noopDynamicModuleLoader);
  const process = processors[EventActionType.MatchStory];
  return invokeProcessor(process, { qpqEventRecord: { apiName: 'api', eventType }, eventParams: [] } as any);
};

describe('getEventMatchStoryActionProcessor (websocket)', () => {
  it('routes a Connect event to onConnect', async () => {
    const result = await invoke(WebSocketEventType.Connect);

    expect(resolveActionResult(result).runtime).toBe(onConnect);
  });

  it('routes a Disconnect event to onDisconnect', async () => {
    const result = await invoke(WebSocketEventType.Disconnect);

    expect(resolveActionResult(result).runtime).toBe(onDisconnect);
  });

  it('routes a Message event to onMessage', async () => {
    const result = await invoke(WebSocketEventType.Message);

    expect(resolveActionResult(result).runtime).toBe(onMessage);
  });

  it('returns a NotFound error for an unknown event type', async () => {
    const result = await invoke('somethingElse');

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.NotFound);
  });
});
