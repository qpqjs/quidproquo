import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askEventDocReadState } from './askEventDocReadState';
import { EventDocActionType } from './EventDocActionType';

describe('askEventDocReadState', () => {
  it('yields a ReadState action with no payload', () => {
    const { action } = captureRequester(askEventDocReadState());

    expect(action).toEqual({ type: EventDocActionType.ReadState, payload: undefined });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askEventDocReadState(), { name: 'current' });

    expect(returned).toEqual({ name: 'current' });
  });
});
