import { ErrorTypeEnum, runStory, StoryError } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { askValidateModelOrThrowError } from './askValidateModelOrThrowError';

const schema = z.object({ count: z.number(), name: z.string() });

// Security regression: a type mismatch throws Invalid naming the path and expectation, never the submitted value.
describe('askValidateModelOrThrowError', () => {
  it('returns a valid model', () => {
    expect(runStory(askValidateModelOrThrowError({ count: 1, name: 'a' }, schema), {})).toEqual({ count: 1, name: 'a' });
  });

  it('throws Invalid without echoing a rejected non-enum value', () => {
    const run = () => runStory(askValidateModelOrThrowError({ count: 'leaked-secret-value-123', name: 'a' } as any, schema), {});

    expect(run).toThrow(StoryError);
    try {
      run();
    } catch (error) {
      expect((error as StoryError).errorType).toBe(ErrorTypeEnum.Invalid);
      expect((error as StoryError).errorText).toContain('count');
      expect((error as StoryError).errorText).not.toContain('leaked-secret-value-123');
    }
  });
});
