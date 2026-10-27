import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askWebEntryInvalidateCache } from './askWebEntryInvalidateCache';
import { WebEntryActionType } from './WebEntryActionType';

describe('askWebEntryInvalidateCache', () => {
  it('yields an InvalidateCache action collecting the paths into an array', () => {
    const { action } = captureRequester(askWebEntryInvalidateCache('site', '/a', '/b'));

    expect(action).toEqual({
      type: WebEntryActionType.InvalidateCache,
      payload: { webEntryName: 'site', paths: ['/a', '/b'] },
    });
  });

  it('defaults to an empty paths array when none are supplied', () => {
    const { action } = captureRequester(askWebEntryInvalidateCache('site'));

    expect(action.payload.paths).toEqual([]);
  });
});
