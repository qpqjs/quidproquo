import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { AdminActionType } from './AdminActionType';
import { askAdminGetLogs } from './askAdminGetLogs';

describe('askAdminGetLogs', () => {
  it('yields a GetLogs action carrying the runtime type and time window', () => {
    const { action } = captureRequester(askAdminGetLogs('API', '2026-01-01', '2026-01-02', 'page-2'));

    expect(action).toEqual({
      type: AdminActionType.GetLogs,
      payload: {
        runtimeType: 'API',
        nextPageKey: 'page-2',
        startIsoDateTime: '2026-01-01',
        endIsoDateTime: '2026-01-02',
      },
    });
  });

  it('leaves the next page key undefined when omitted', () => {
    const { action } = captureRequester(askAdminGetLogs('API', '2026-01-01', '2026-01-02'));

    expect(action.payload.nextPageKey).toBeUndefined();
  });
});
