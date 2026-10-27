import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isDuplicateFifoMessage } from './fifoDeduplication';

// Security regression: FIFO deduplication must behave like SQS / SNS (same id inside five minutes is dropped, the
// window is per resource), so a dev-server run and a deployed run process the same replayed message the same way.
describe('isDuplicateFifoMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('drops a second message with the same key inside the window', () => {
    const key = `fifo-probe-${Date.now()}:same-id`;

    expect(isDuplicateFifoMessage(key)).toBe(false);
    expect(isDuplicateFifoMessage(key)).toBe(true);
  });

  it('keeps the window per resource: the same id on another queue is not a duplicate', () => {
    const stamp = Date.now();

    expect(isDuplicateFifoMessage(`fifo-probe-a-${stamp}:id`)).toBe(false);
    expect(isDuplicateFifoMessage(`fifo-probe-b-${stamp}:id`)).toBe(false);
  });

  it('accepts the same key again once five minutes have passed', () => {
    const key = `fifo-probe-expiry-${Date.now()}:id`;

    expect(isDuplicateFifoMessage(key)).toBe(false);
    vi.advanceTimersByTime(5 * 60 * 1000 - 1);
    expect(isDuplicateFifoMessage(key)).toBe(true);
    vi.advanceTimersByTime(2);
    expect(isDuplicateFifoMessage(key)).toBe(false);
  });
});
