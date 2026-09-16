import { Action, AskResponse, ContextActionType, QueueEvent, QueueMessage, runStory } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { createServiceRequester } from './createServiceRequester';
import { serviceRequest } from './serviceRequest';
import { SERVICE_REQUEST_DEFERRED } from './ServiceRequestDeferred';

const connectionInfo = { apiName: 'api', connectionId: 'c1', correlationId: 'corr-1' };

const buildEvent = (payload: unknown): QueueEvent<QueueMessage<unknown>> => ({
  id: 'evt-1',
  message: { type: 'serviceRequest', payload },
});

describe('serviceRequest', () => {
  it('exposes the requester method', () => {
    const requester = createServiceRequester<{ a: number }>('billing', 'charge');
    const wrapper = serviceRequest(requester, function* () {
      return undefined;
    });

    expect(wrapper.serviceRequest).toEqual({ method: 'charge' });
  });

  it('runs the runtime and sends its result back to the calling connection', () => {
    const requester = createServiceRequester<{ a: number }, number>('billing', 'charge');
    let sent: Action<any> | undefined;

    const wrapper = serviceRequest(requester, function* (payload): AskResponse<number> {
      return payload.a + 1;
    });

    const result = runStory(wrapper(buildEvent({ a: 41 })), {
      [ContextActionType.Read]: connectionInfo,
      [WebsocketActionType.SendMessage]: (action: Action<any>) => {
        sent = action;
        return undefined;
      },
    });

    expect(result).toBe(true);
    expect(sent?.payload.connectionId).toBe('c1');
    expect(sent?.payload.payload.correlationId).toBe('corr-1');
    expect(sent?.payload.payload.payload).toEqual({ success: true, result: 42 });
  });

  it('sends nothing when the runtime defers the response to a later execution', () => {
    const requester = createServiceRequester<{ a: number }, number>('billing', 'charge');
    let sent = false;

    const wrapper = serviceRequest(requester, function* () {
      return SERVICE_REQUEST_DEFERRED;
    });

    const result = runStory(wrapper(buildEvent({ a: 1 })), {
      [ContextActionType.Read]: connectionInfo,
      [WebsocketActionType.SendMessage]: () => {
        sent = true;
        return undefined;
      },
    });

    expect(result).toBe(true);
    expect(sent).toBe(false);
  });
});
