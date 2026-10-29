import { ErrorTypeEnum, EventActionType, QpqRuntimeType } from '@qpqjs/core';
import { buildStoryResult } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { storyResultToMetadata } from './storyResultToMetadata';

const baseStoryResult = buildStoryResult({
  correlation: 'mod::abc',
  moduleName: 'mod',
  runtimeType: QpqRuntimeType.UI,
  startedAt: '2026-06-26T00:00:00.000Z',
  finishedAt: '2026-06-26T00:00:01.000Z',
});

describe('storyResultToMetadata', () => {
  it('derives execution time and joins tags into the generic field', () => {
    const metadata = storyResultToMetadata({ ...baseStoryResult, tags: ['alpha', 'beta'] });

    expect(metadata.executionTimeMs).toBe(1000);
    expect(metadata.generic).toBe('alpha, beta');
    expect(metadata.correlation).toBe('mod::abc');
  });

  it('reads the username from the session decoded access token', () => {
    const metadata = storyResultToMetadata({ ...baseStoryResult, session: { decodedAccessToken: { username: 'joe' } } as any });

    expect(metadata.userInfo).toBe('joe');
  });

  it('falls back to the identity a route auth decode put on the GetStorySession result', () => {
    const history = [{ act: { type: EventActionType.GetStorySession }, res: { decodedAccessToken: { username: 'qpqjs/quidproquo#1' } } }];
    const metadata = storyResultToMetadata({ ...baseStoryResult, runtimeType: QpqRuntimeType.API, history: history as any });

    expect(metadata.userInfo).toBe('qpqjs/quidproquo#1');
  });

  it('records the error and clears the ttl when the story failed', () => {
    const metadata = storyResultToMetadata({ ...baseStoryResult, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'kaboom' } }, 99);

    expect(metadata.error).toBe('kaboom');
    expect(metadata.ttl).toBeUndefined();
  });
});
