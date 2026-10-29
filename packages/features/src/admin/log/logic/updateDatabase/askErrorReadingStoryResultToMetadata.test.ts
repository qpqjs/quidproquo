import { DateActionType, QpqRuntimeType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askErrorReadingStoryResultToMetadata } from './askErrorReadingStoryResultToMetadata';

describe('askErrorReadingStoryResultToMetadata', () => {
  it('builds error metadata stamped with the current time', () => {
    const now = '2026-06-26T00:00:00.000Z';
    const metadata = runStory(askErrorReadingStoryResultToMetadata('mod::abc'), {
      [DateActionType.Now]: now,
    });

    expect(metadata).toEqual({
      correlation: 'mod::abc',
      moduleName: 'mod',
      runtimeType: QpqRuntimeType.EXECUTE_STORY,
      startedAt: now,
      generic: 'Error loading story result',
      executionTimeMs: 0,
      error: 'Error loading story result',
    });
  });
});
