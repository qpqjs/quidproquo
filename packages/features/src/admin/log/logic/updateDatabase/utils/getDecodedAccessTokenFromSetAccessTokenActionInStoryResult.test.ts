import { UserDirectoryActionType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { getDecodedAccessTokenFromSetAccessTokenActionInStoryResult } from './getDecodedAccessTokenFromSetAccessTokenActionInStoryResult';

describe('getDecodedAccessTokenFromSetAccessTokenActionInStoryResult', () => {
  it('returns the decoded token from a SetAccessToken action', () => {
    const decoded = { username: 'joe' };
    const storyResult = { history: [{ act: { type: UserDirectoryActionType.SetAccessToken }, res: decoded }] } as any;

    expect(getDecodedAccessTokenFromSetAccessTokenActionInStoryResult(storyResult)).toBe(decoded);
  });

  it('returns undefined when no SetAccessToken action is present', () => {
    expect(getDecodedAccessTokenFromSetAccessTokenActionInStoryResult({ history: [] } as any)).toBeUndefined();
  });
});
