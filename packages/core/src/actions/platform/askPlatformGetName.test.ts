import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askPlatformGetName } from './askPlatformGetName';
import { PlatformActionType } from './PlatformActionType';

describe('askPlatformGetName', () => {
  it('yields a GetName action with an empty payload', () => {
    const { action } = captureRequester(askPlatformGetName());

    expect(action).toEqual({ type: PlatformActionType.GetName, payload: {} });
  });
});
