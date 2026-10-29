import { ContextActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askConnectionDeleteByConnectionId } from './askConnectionDeleteByConnectionId';

describe('askConnectionDeleteByConnectionId', () => {
  it('deletes the connection by id from the store', () => {
    let captured: any;

    runStory(askConnectionDeleteByConnectionId('c1'), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [KeyValueStoreActionType.Delete]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload.keyValueStoreName).toBe('qpq-wsq-demo');
    expect(captured.payload.key).toBe('c1');
  });
});
