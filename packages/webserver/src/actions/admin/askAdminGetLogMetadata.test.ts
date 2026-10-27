import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { AdminActionType } from './AdminActionType';
import { askAdminGetLogMetadata } from './askAdminGetLogMetadata';

describe('askAdminGetLogMetadata', () => {
  it('yields a GetLogMetadata action with the correlation id', () => {
    const { action } = captureRequester(askAdminGetLogMetadata('corr-1'));

    expect(action).toEqual({
      type: AdminActionType.GetLogMetadata,
      payload: { correlationId: 'corr-1' },
    });
  });
});
