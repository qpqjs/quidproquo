import { EventActionType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { getDecodedAccessTokenFromGetStorySessionActionInStoryResult } from './getDecodedAccessTokenFromGetStorySessionActionInStoryResult';

describe('getDecodedAccessTokenFromGetStorySessionActionInStoryResult', () => {
  it('returns the decoded token from the session a GetStorySession action produced', () => {
    const decoded = { username: 'qpqjs/quidproquo#1' };
    const storyResult = { history: [{ act: { type: EventActionType.GetStorySession }, res: { decodedAccessToken: decoded } }] } as any;

    expect(getDecodedAccessTokenFromGetStorySessionActionInStoryResult(storyResult)).toBe(decoded);
  });

  it('returns undefined when the action produced no session', () => {
    const storyResult = { history: [{ act: { type: EventActionType.GetStorySession }, res: undefined }] } as any;

    expect(getDecodedAccessTokenFromGetStorySessionActionInStoryResult(storyResult)).toBeUndefined();
  });

  it('returns undefined when no GetStorySession action is present', () => {
    expect(getDecodedAccessTokenFromGetStorySessionActionInStoryResult({ history: [] } as any)).toBeUndefined();
  });
});
