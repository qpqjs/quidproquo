import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askFileReadBinaryContents } from './askFileReadBinaryContents';
import { FileActionType } from './FileActionType';

describe('askFileReadBinaryContents', () => {
  it('yields a ReadBinaryContents action carrying the drive and filepath', () => {
    const { action } = captureRequester(askFileReadBinaryContents('drive', 'path/file.bin'));

    expect(action).toEqual({
      type: FileActionType.ReadBinaryContents,
      payload: { drive: 'drive', filepath: 'path/file.bin' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const data = { base64Data: 'AA==' };
    const { returned } = captureRequester(askFileReadBinaryContents('drive', 'path/file.bin'), data);

    expect(returned).toBe(data);
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileReadBinaryContents('drive', 'path/file.bin', 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
