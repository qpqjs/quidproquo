import { describe, expect, it, vi } from 'vitest';

import { askConfigGetParameter } from '../actions/config/askConfigGetParameter';
import { ConfigActionType } from '../actions/config/ConfigActionType';
import { GuidActionType } from '../actions/guid/GuidActionType';
import { PlatformActionType } from '../actions/platform/PlatformActionType';
import { expectError, runStory, throwsError } from '../testing/storyTesting';
import { AskResponse } from '../types';
import { askRetry } from './askRetry';

function* loadConfig(): AskResponse<string> {
  return yield* askConfigGetParameter('flaky-param');
}

describe('askRetry', () => {
  it('returns the success result without delaying when the logic succeeds first try', () => {
    const delay = vi.fn();

    const result = runStory(askRetry(loadConfig, 3, 250), {
      [ConfigActionType.GetParameter]: 'ok',
      [PlatformActionType.Delay]: delay,
    });

    expect(result).toEqual({ success: true, result: 'ok' });
    expect(delay).not.toHaveBeenCalled();
  });

  it('retries until the logic succeeds, delaying between attempts', () => {
    let attempt = 0;
    const delay = vi.fn();

    const result = runStory(askRetry(loadConfig, 3, 250), {
      [ConfigActionType.GetParameter]: () => (++attempt < 3 ? throwsError('Throttling', 'slow down') : 'ok'),
      [PlatformActionType.Delay]: delay,
    });

    expect(result).toEqual({ success: true, result: 'ok' });
    expect(attempt).toBe(3);
    expect(delay).toHaveBeenCalledTimes(2);
  });

  it('gives up after maxRetries and returns the last failure', () => {
    const result = runStory(askRetry(loadConfig, 2, 250), {
      [ConfigActionType.GetParameter]: throwsError('Throttling', 'still slow'),
      [PlatformActionType.Delay]: undefined,
    });

    expect(expectError(result).errorText).toBe('still slow');
  });

  it('stops immediately for an error type not in the retry list', () => {
    const config = vi.fn(() => throwsError('FatalError', 'nope'));

    const result = runStory(askRetry(loadConfig, 5, 250, ['Throttling']), {
      [ConfigActionType.GetParameter]: config,
    });

    expect(result.success).toBe(false);
    expect(config).toHaveBeenCalledTimes(1);
  });

  it('multiplies the wait by the 1-based attempt number with linearBackoff', () => {
    const waits: number[] = [];
    const recordDelay = (action: any) => {
      waits.push(action.payload.timeMs);
    };

    runStory(askRetry(loadConfig, 3, 100, undefined, { linearBackoff: true }), {
      [ConfigActionType.GetParameter]: throwsError('Throttling', 'slow down'),
      [PlatformActionType.Delay]: recordDelay,
    });

    expect(waits).toEqual([100, 200, 300]);
  });

  it('adds guid-derived jitter of at most maxJitterMs to each wait', () => {
    const waits: number[] = [];
    const recordDelay = (action: any) => {
      waits.push(action.payload.timeMs);
    };

    runStory(askRetry(loadConfig, 1, 100, undefined, { maxJitterMs: 1000 }), {
      [ConfigActionType.GetParameter]: throwsError('Throttling', 'slow down'),
      [PlatformActionType.Delay]: recordDelay,
      // 0x80 = 128 -> floor((128 / 255) * 1000) = 501
      [GuidActionType.New]: '80ffffff-guid',
    });

    expect(waits).toEqual([100 + Math.floor((128 / 255) * 1000)]);
  });

  it('ignores jitter when the guid processor returns a non-hex id', () => {
    const waits: number[] = [];
    const recordDelay = (action: any) => {
      waits.push(action.payload.timeMs);
    };

    runStory(askRetry(loadConfig, 1, 100, undefined, { maxJitterMs: 1000 }), {
      [ConfigActionType.GetParameter]: throwsError('Throttling', 'slow down'),
      [PlatformActionType.Delay]: recordDelay,
      [GuidActionType.New]: 'zz-not-hex',
    });

    // A NaN jitter byte must not poison the wait
    expect(waits).toEqual([100]);
  });
});
