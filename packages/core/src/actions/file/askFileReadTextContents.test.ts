import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askFileReadTextContents } from './askFileReadTextContents';
import { FileActionType } from './FileActionType';

describe('askFileReadTextContents', () => {
  it('yields a ReadTextContents action carrying the drive and filepath', () => {
    const { action } = captureRequester(askFileReadTextContents('drive', 'path/file.txt'));

    expect(action).toEqual({
      type: FileActionType.ReadTextContents,
      payload: { drive: 'drive', filepath: 'path/file.txt' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askFileReadTextContents('drive', 'path/file.txt'), 'file body');

    expect(returned).toBe('file body');
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileReadTextContents('drive', 'path/file.txt', 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
