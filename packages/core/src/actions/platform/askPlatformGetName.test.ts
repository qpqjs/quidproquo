import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askPlatformGetName } from './askPlatformGetName';
import { PlatformActionType } from './PlatformActionType';

describe('askPlatformGetName', () => {
  it('yields a GetName action with no payload', () => {
    const { action } = captureRequester(askPlatformGetName());

    expect(action).toEqual({ type: PlatformActionType.GetName });
  });
});
