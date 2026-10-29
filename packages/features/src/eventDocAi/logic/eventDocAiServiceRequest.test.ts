import {
  Action,
  AskResponse,
  ConfigActionType,
  ContextActionType,
  ErrorTypeEnum,
  InlineFunctionActionType,
  QueueEvent,
  QueueMessage,
  UserDirectoryActionType,
} from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import {
  EVENT_DOC_AUTHORISER_GLOBAL,
  EVENT_DOC_STORE_NAME_GLOBAL,
  EVENT_DOC_TYPE_GLOBAL,
  EVENT_DOC_USER_DIRECTORY_GLOBAL,
} from '../../eventDoc/constants/eventDocGlobalNames';
import { createServiceRequester } from '../../webSocketQueue/logic/service';
import { EVENT_DOC_AI_SERVICE_NAME_GLOBAL } from '../constants/eventDocAiGlobalNames';
import { eventDocAiServiceRequest } from './eventDocAiServiceRequest';

const connectionInfo = { apiName: 'api', connectionId: 'c1', correlationId: 'corr-1' };

const buildEvent = (payload: unknown): QueueEvent<QueueMessage<unknown>> => ({
  id: 'evt-1',
  message: { type: 'serviceRequest', payload },
});

type Harness = { sent: Action<any> | undefined; authoriseCalls: unknown[]; ran: boolean };

const run = (authorise: string, authoriseOutcome: 'allow' | 'forbid' = 'allow'): Harness => {
  const harness: Harness = { sent: undefined, authoriseCalls: [], ran: false };
  const globals: Record<string, string> = {
    [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'users',
    [EVENT_DOC_AI_SERVICE_NAME_GLOBAL]: 'svc',
    [EVENT_DOC_TYPE_GLOBAL]: 'doc',
    [EVENT_DOC_STORE_NAME_GLOBAL]: 'docs',
    [EVENT_DOC_AUTHORISER_GLOBAL]: authorise,
  };

  const requester = createServiceRequester<{ name: string }, string>('svc', 'ChatCreate');
  const wrapper = eventDocAiServiceRequest(requester, function* (): AskResponse<string> {
    harness.ran = true;
    return 'chat-1';
  });

  runStory(wrapper(buildEvent({ docId: 'doc-1', name: 'hello' })), {
    [ContextActionType.Read]: connectionInfo,
    [ConfigActionType.GetGlobal]: (action: Action<{ globalName: string }>) => globals[action.payload.globalName],
    [UserDirectoryActionType.ReadAccessToken]: { userId: 'user-1', username: 'joe' },
    [InlineFunctionActionType.Execute]: (action: Action<{ functionName: string; payload: unknown }>) => {
      harness.authoriseCalls.push(action.payload);
      return authoriseOutcome === 'forbid' ? throwsError(ErrorTypeEnum.Forbidden, 'Missing permission: eventDoc:docs:read') : undefined;
    },
    [WebsocketActionType.SendMessage]: (action: Action<any>) => {
      harness.sent = action;
      return undefined;
    },
  });

  return harness;
};

// Security regression: a chat over the websocket must pass the collection's own `authorise` hook for read, exactly
// as the routes and the MCP tools do, so a tenant member without the collection's read permission cannot open a
// chat and have the model read the document for them.
describe('eventDocAiServiceRequest', () => {
  it("runs the collection's authoriser for read before the handler", () => {
    const harness = run('docs-authorise');

    expect(harness.authoriseCalls).toEqual([{ functionName: 'docs-authorise', payload: { storeName: 'docs', action: 'read' } }]);
    expect(harness.ran).toBe(true);
    expect(harness.sent?.payload.payload.payload).toEqual({ success: true, result: 'chat-1' });
  });

  it('refuses the request and never runs the handler when the authoriser forbids', () => {
    const harness = run('docs-authorise', 'forbid');

    expect(harness.ran).toBe(false);
    expect(harness.sent?.payload.payload.payload).toMatchObject({ success: false, error: { errorType: ErrorTypeEnum.Forbidden } });
  });

  it('runs ungated when the collection declares no authoriser', () => {
    const harness = run('');

    expect(harness.authoriseCalls).toEqual([]);
    expect(harness.ran).toBe(true);
  });
});
