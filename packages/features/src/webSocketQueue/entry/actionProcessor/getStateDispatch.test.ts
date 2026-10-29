import { StateActionType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { getStateDispatch } from './getStateDispatch';

describe('getStateDispatch', () => {
  it('maps the state dispatch action to a custom processor', () => {
    const processors = getStateDispatch([]);

    expect(typeof processors[StateActionType.Dispatch]).toBe('function');
  });
});
