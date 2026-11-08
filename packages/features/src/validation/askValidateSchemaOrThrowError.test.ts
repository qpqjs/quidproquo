import { ErrorTypeEnum } from '@qpqjs/core';
import { runStory, StoryError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { askValidateSchemaOrThrowError } from './askValidateSchemaOrThrowError';

const schema = z.object({ count: z.number().default(10), name: z.string() });

describe('askValidateSchemaOrThrowError', () => {
  it('returns the parsed data, with defaults applied and unknown keys dropped', () => {
    expect(runStory(askValidateSchemaOrThrowError(schema, { name: 'a', extra: true }), {})).toEqual({ count: 10, name: 'a' });
  });

  it('throws Invalid naming the path, prefixed with the label when one is given', () => {
    const run = () => runStory(askValidateSchemaOrThrowError(schema, { count: 'leaked-secret-value-123', name: 'a' }, 'request body'), {});

    expect(run).toThrow(StoryError);
    try {
      run();
    } catch (error) {
      expect((error as StoryError).errorType).toBe(ErrorTypeEnum.Invalid);
      expect((error as StoryError).errorText).toMatch(/^Invalid request body: /);
      expect((error as StoryError).errorText).toContain('count');
      expect((error as StoryError).errorText).not.toContain('leaked-secret-value-123');
    }
  });

  it('throws the bare detail without a label', () => {
    const run = () => runStory(askValidateSchemaOrThrowError(schema, { count: 'x', name: 'a' }), {});

    try {
      run();
    } catch (error) {
      expect((error as StoryError).errorText).not.toMatch(/^Invalid /);
      expect((error as StoryError).errorText).toContain('count');
    }
  });
});
