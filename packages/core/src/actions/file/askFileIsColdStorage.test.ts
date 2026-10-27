import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askFileIsColdStorage } from './askFileIsColdStorage';
import { FileActionType } from './FileActionType';

describe('askFileIsColdStorage', () => {
  it('yields an IsColdStorage action carrying the drive and filepath', () => {
    const { action } = captureRequester(askFileIsColdStorage('drive', 'path/file.txt'));

    expect(action).toEqual({
      type: FileActionType.IsColdStorage,
      payload: { drive: 'drive', filepath: 'path/file.txt' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askFileIsColdStorage('drive', 'path/file.txt'), false);

    expect(returned).toBe(false);
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileIsColdStorage('drive', 'path/file.txt', 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
