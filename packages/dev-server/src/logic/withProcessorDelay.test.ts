import { ActionProcessorList } from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { DevServerDelayConfig } from '../types';
import { delayForAction, resolveDelayMs, withProcessorDelay } from './withProcessorDelay';

describe('resolveDelayMs', () => {
  it.each([
    ['undefined delay', undefined, 'AnyAction', 0],
    ['flat number for any action', 50, 'AnyAction', 50],
    ['per-action override', { AnyAction: 200, default: 10 }, 'AnyAction', 200],
    ['default fallback', { OtherAction: 200, default: 10 }, 'AnyAction', 10],
    ['no match and no default', { OtherAction: 200 }, 'AnyAction', 0],
  ])('returns %s', (_label: string, delay: DevServerDelayConfig | undefined, actionType: string, expected: number) => {
    expect(resolveDelayMs(delay, actionType)).toBe(expected);
  });
});

describe('delayForAction', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sleeps for the resolved duration before resolving', async () => {
    vi.useFakeTimers();
    let resolved = false;
    const pending = delayForAction(100, 'AnyAction').then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(50);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(50);
    await pending;
    expect(resolved).toBe(true);
  });

  it('resolves immediately when the delay is zero', async () => {
    vi.useFakeTimers();
    await delayForAction(undefined, 'AnyAction');
    await delayForAction(0, 'AnyAction');
  });
});

describe('withProcessorDelay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the processors unchanged when delay is undefined', () => {
    const processors: ActionProcessorList = { A: vi.fn() };
    expect(withProcessorDelay(processors, undefined)).toBe(processors);
  });

  it('leaves processors without a delay untouched by identity', () => {
    const a = vi.fn();
    const b = vi.fn();
    const processors: ActionProcessorList = { A: a, B: b };

    const wrapped = withProcessorDelay(processors, { A: 100 });

    expect(wrapped.B).toBe(b);
    expect(wrapped.A).not.toBe(a);
  });

  it('sleeps then delegates to the wrapped processor', async () => {
    vi.useFakeTimers();
    const inner = vi.fn(async () => 'value');
    const wrapped = withProcessorDelay({ A: inner as any }, { A: 100 });

    const promise = (wrapped.A as any)('payload');
    expect(inner).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toBe('value');
    expect(inner).toHaveBeenCalledWith('payload');
  });
});
