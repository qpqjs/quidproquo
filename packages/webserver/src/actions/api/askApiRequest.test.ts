import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { ApiActionType } from './ApiActionType';
import { askApiRequest, askApiRequestBase } from './askApiRequest';

describe('askApiRequest', () => {
  it('yields a Request action defaulting the response type to json', () => {
    const { action } = captureRequester(askApiRequest('userService', 'GET', '/users'));

    expect(action).toEqual({
      type: ApiActionType.Request,
      payload: {
        service: 'userService',
        endpoint: '/users',
        method: 'GET',
        body: undefined,
        headers: undefined,
        params: undefined,
        responseType: 'json',
      },
    });
  });

  it('forwards the supplied options', () => {
    const { action } = captureRequester(
      askApiRequest('files', 'POST', '/upload', {
        body: { name: 'a' },
        headers: { authorization: 'token' },
        params: { force: 'true' },
        responseType: 'binary',
      }),
    );

    expect(action).toEqual({
      type: ApiActionType.Request,
      payload: {
        service: 'files',
        endpoint: '/upload',
        method: 'POST',
        body: { name: 'a' },
        headers: { authorization: 'token' },
        params: { force: 'true' },
        responseType: 'binary',
      },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askApiRequest('userService', 'GET', '/users'), { ok: true });

    expect(returned).toEqual({ ok: true });
  });
});

describe('errorType', () => {
  it('lists every error the processor can produce, namespaced by the action type', () => {
    expect(askApiRequestBase.errorType).toEqual({
      Timeout: `${ApiActionType.Request}-Timeout`,
      UnsupportedMethod: `${ApiActionType.Request}-UnsupportedMethod`,
      NetworkError: `${ApiActionType.Request}-NetworkError`,
    });
  });
});
