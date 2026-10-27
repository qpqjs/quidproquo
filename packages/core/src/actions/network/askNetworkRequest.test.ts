import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askNetworkRequest, askNetworkRequestBase } from './askNetworkRequest';
import { NetworkActionType } from './NetworkActionType';

describe('askNetworkRequest', () => {
  it('yields a Request action with the supplied options', () => {
    const { action } = captureRequester(askNetworkRequest('POST', 'https://api.test/users', { body: { name: 'a' }, headers: { 'x-key': '1' } }));

    expect(action).toEqual({
      type: NetworkActionType.Request,
      payload: {
        url: 'https://api.test/users',
        method: 'POST',
        body: { name: 'a' },
        headers: { 'x-key': '1' },
        basePath: undefined,
        params: undefined,
        responseType: 'json',
      },
    });
  });

  it('defaults the responseType to json when no options are given', () => {
    const { action } = captureRequester(askNetworkRequest('GET', 'https://api.test'));

    expect(action.payload.responseType).toBe('json');
  });

  it('returns the response the runtime resolves', () => {
    const response = { status: 200, body: { ok: true } };
    const { returned } = captureRequester(askNetworkRequest('GET', 'https://api.test'), response);

    expect(returned).toBe(response);
  });

  it('propagates a request timeout as a thrown StoryError', () => {
    const runFailingStory = () =>
      runStory(askNetworkRequest('GET', 'https://api.test/slow'), {
        [NetworkActionType.Request]: throwsError(askNetworkRequestBase.errorType.Timeout, 'Network request timed out'),
      });

    expect(runFailingStory).toThrow(StoryError);
    expect(runFailingStory).toThrow(`${askNetworkRequestBase.errorType.Timeout}: Network request timed out`);
  });
});

describe('errorType', () => {
  it('lists every error the processor can produce, namespaced by the action type', () => {
    expect(askNetworkRequestBase.errorType).toEqual({
      Timeout: `${NetworkActionType.Request}-Timeout`,
      UnsupportedMethod: `${NetworkActionType.Request}-UnsupportedMethod`,
      NetworkError: `${NetworkActionType.Request}-NetworkError`,
    });
  });
});
