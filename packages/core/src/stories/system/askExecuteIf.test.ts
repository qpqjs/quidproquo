import { describe, expect, it, vi } from 'vitest';

import { askRandomNumber } from '../../actions/math/askRandomNumber';
import { MathActionType } from '../../actions/math/MathActionType';
import { runStory } from '../../testing/storyTesting';
import { askExecuteIf } from './askExecuteIf';

describe('askExecuteIf', () => {
  it('runs the story when the condition is true', () => {
    const result = runStory(askExecuteIf(askRandomNumber(), true), { [MathActionType.RandomNumber]: 0.5 });

    expect(result).toBe(0.5);
  });

  it('skips the story and returns undefined when the condition is false', () => {
    const random = vi.fn();

    const result = runStory(askExecuteIf(askRandomNumber(), false), { [MathActionType.RandomNumber]: random });

    expect(result).toBeUndefined();
    expect(random).not.toHaveBeenCalled();
  });

  // Supports the inline short-circuit idiom: `askExecuteIf(flag && askThing())`.
  // When `flag` is false the expression is the boolean `false` (the story is never even
  // created), so askExecuteIf gets a non-story value and must return undefined.
  it('returns undefined for the `flag && story` idiom when flag is false', () => {
    const isNew = false;
    const random = vi.fn();

    // e.g. yield* askExecuteIf(user.isNew && askSendWelcomeEmail(user));
    const result = runStory(askExecuteIf(isNew && askRandomNumber()), { [MathActionType.RandomNumber]: random });

    expect(result).toBeUndefined();
    expect(random).not.toHaveBeenCalled();
  });
});
