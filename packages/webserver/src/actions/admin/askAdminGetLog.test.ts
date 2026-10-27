import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { AdminActionType } from './AdminActionType';
import { askAdminGetLog } from './askAdminGetLog';

describe('askAdminGetLog', () => {
  it('yields a GetLog action with the correlation id', () => {
    const { action } = captureRequester(askAdminGetLog('corr-1'));

    expect(action).toEqual({
      type: AdminActionType.GetLog,
      payload: { correlationId: 'corr-1' },
    });
  });

  it('returns what the runtime resolves', () => {
    const log = { correlation: 'corr-1' };
    const { returned } = captureRequester(askAdminGetLog('corr-1'), log);

    expect(returned).toBe(log);
  });
});
