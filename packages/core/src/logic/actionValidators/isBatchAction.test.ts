import { describe, expect, it } from 'vitest';

import { SystemActionType } from '../../actions';
import { isBatchAction } from './isBatchAction';

describe('isBatchAction', () => {
  it('is true for a batch action', () => {
    expect(isBatchAction({ type: SystemActionType.Batch, payload: { actions: [] } })).toBe(true);
  });

  it('is false for any other action', () => {
    expect(isBatchAction({ type: '@quidproquo-core/Date/Now' })).toBe(false);
  });
});
