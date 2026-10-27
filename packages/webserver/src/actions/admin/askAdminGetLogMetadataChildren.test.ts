import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { AdminActionType } from './AdminActionType';
import { askAdminGetLogMetadataChildren } from './askAdminGetLogMetadataChildren';

describe('askAdminGetLogMetadataChildren', () => {
  it('yields a GetLogMetadataChildren action with the next page key', () => {
    const { action } = captureRequester(askAdminGetLogMetadataChildren('corr-1', 'page-2'));

    expect(action).toEqual({
      type: AdminActionType.GetLogMetadataChildren,
      payload: { correlationId: 'corr-1', nextPageKey: 'page-2' },
    });
  });

  it('leaves the next page key undefined when omitted', () => {
    const { action } = captureRequester(askAdminGetLogMetadataChildren('corr-1'));

    expect(action).toEqual({
      type: AdminActionType.GetLogMetadataChildren,
      payload: { correlationId: 'corr-1', nextPageKey: undefined },
    });
  });
});
