import { UserDirectoryActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askWebSocketQueueSessionUserSet } from './askWebSocketQueueSessionUserSet';

describe('askWebSocketQueueSessionUserSet', () => {
  it('makes a principal that names a session user the session user, vouching for it', () => {
    let captured: any;

    runStory(
      askWebSocketQueueSessionUserSet({
        userId: 'guest:g1',
        scope: 'TENANT#t1',
        sessionUser: { username: 'Ada', exp: 4102444800, roles: ['guest'] },
      }),
      {
        [UserDirectoryActionType.SetDecodedAccessToken]: (action: any) => {
          captured = action.payload;
        },
      },
    );

    expect(captured).toEqual({
      decodedAccessToken: { userId: 'guest:g1', username: 'Ada', exp: 4102444800, roles: ['guest'], userDirectory: '', wasValid: true },
    });
  });

  it('leaves the session alone for a principal that names no session user', () => {
    let called = false;

    runStory(askWebSocketQueueSessionUserSet({ userId: 'guest:g1' }), {
      [UserDirectoryActionType.SetDecodedAccessToken]: () => {
        called = true;
      },
    });

    expect(called).toBe(false);
  });
});
