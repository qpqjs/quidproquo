import { describe, expect, it } from 'vitest';

import { reportFutureEventProblem } from './reportFutureEventProblem';

describe('reportFutureEventProblem', () => {
  const now = '2026-11-09T05:00:00.000Z';

  it('accepts the past and up to five minutes ahead, for clocks a little apart', () => {
    expect(reportFutureEventProblem('2026-11-01T00:00:00.000Z', now)).toBeNull();
    expect(reportFutureEventProblem('2026-11-09T05:05:00.000Z', now)).toBeNull();
  });

  it('refuses an event dated further ahead than that', () => {
    expect(reportFutureEventProblem('2026-11-09T05:05:00.001Z', now)).toBe(
      'at 2026-11-09T05:05:00.001Z is more than 5 minutes after now (2026-11-09T05:00:00.000Z)',
    );
  });
});
