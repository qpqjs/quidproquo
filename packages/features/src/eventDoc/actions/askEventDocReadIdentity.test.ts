import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askEventDocReadIdentity } from './askEventDocReadIdentity';
import { EventDocActionType } from './EventDocActionType';

describe('askEventDocReadIdentity', () => {
  it('yields a ReadIdentity action with no payload', () => {
    const { action } = captureRequester(askEventDocReadIdentity());

    expect(action).toEqual({ type: EventDocActionType.ReadIdentity, payload: undefined });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askEventDocReadIdentity(), { id: 'doc-1' });

    expect(returned).toEqual({ id: 'doc-1' });
  });
});
