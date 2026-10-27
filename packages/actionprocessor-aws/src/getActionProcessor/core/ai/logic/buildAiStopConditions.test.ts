import { describe, expect, it, vi } from 'vitest';

import { buildAiStopConditions } from './buildAiStopConditions';

vi.mock('ai', () => ({
  stepCountIs: (n: number) => ({ __stop: n }),
}));

const noSteps = { steps: [] };

describe('buildAiStopConditions', () => {
  it('is empty with no limits, so the loop runs until the model stops', () => {
    expect(buildAiStopConditions({})).toEqual([]);
  });

  it('adds the step cap when given', () => {
    expect(buildAiStopConditions({ maxSteps: 7 })).toEqual([{ __stop: 7 }]);
  });

  it('adds a wall-clock condition that trips once the budget is spent', async () => {
    let clock = 1000;
    const [outOfTime] = buildAiStopConditions({ maxDurationMs: 500 }, () => clock);

    expect(await outOfTime(noSteps as never)).toBe(false);

    clock = 1499;
    expect(await outOfTime(noSteps as never)).toBe(false);

    clock = 1500;
    expect(await outOfTime(noSteps as never)).toBe(true);
  });
});
