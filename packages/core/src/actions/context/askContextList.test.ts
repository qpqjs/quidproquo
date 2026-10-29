import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askContextList } from './askContextList';
import { ContextActionType } from './ContextActionType';

describe('askContextList', () => {
  it('yields a List action with no payload', () => {
    const { action } = captureRequester(askContextList());

    expect(action).toEqual({ type: ContextActionType.List, payload: undefined });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askContextList(), { tenantId: 't1' });

    expect(returned).toEqual({ tenantId: 't1' });
  });
});
