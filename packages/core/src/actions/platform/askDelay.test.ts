import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askDelay } from './askDelay';
import { PlatformActionType } from './PlatformActionType';

describe('askDelay', () => {
  it('yields a Delay action with the delay in milliseconds', () => {
    const { action } = captureRequester(askDelay(250));

    expect(action).toEqual({ type: PlatformActionType.Delay, payload: { timeMs: 250 } });
  });
});
