import { ConfigActionType, ContextActionType, runStory } from 'quidproquo-core';
import { ServiceFunctionActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_STORE_NAME_GLOBAL } from '../../eventDoc';
import { SERVICE_REQUEST_DEFERRED } from '../../webSocketQueue/logic/service';
import { askEventDocAiContinueHandoff } from './askEventDocAiContinueHandoff';

describe('askEventDocAiContinueHandoff', () => {
  it('fires the continuation service function async and defers the reply', () => {
    let executed: unknown;

    const result = runStory(askEventDocAiContinueHandoff('chat-1', 2), {
      [ContextActionType.Read]: { serviceName: 'log', type: 'log', docId: 'doc-1' },
      [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) =>
        action.payload.globalName === EVENT_DOC_STORE_NAME_GLOBAL ? 'logs' : '',
      [ServiceFunctionActionType.Execute]: (action: { payload: unknown }) => {
        executed = action.payload;
        return undefined;
      },
    });

    expect(executed).toEqual({
      service: 'log',
      functionName: 'logsAiChatContinue',
      payload: { docId: 'doc-1', chatId: 'chat-1', lengthResumes: 2 },
      isAsync: true,
    });
    expect(result).toBe(SERVICE_REQUEST_DEFERRED);
  });
});
