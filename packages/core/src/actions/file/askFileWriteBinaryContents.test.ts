import { describe, expect, it } from 'vitest';

import { StorageDriveTier } from '../../config';
import { captureRequester } from '../../testing';
import { QPQBinaryData } from '../../types';
import { askFileWriteBinaryContents } from './askFileWriteBinaryContents';
import { FileActionType } from './FileActionType';

const data: QPQBinaryData = { base64Data: 'AA==', filename: 'file.bin' };

describe('askFileWriteBinaryContents', () => {
  it('yields a WriteBinaryContents action carrying the drive, filepath, data and write options', () => {
    const options = { storageDriveTier: StorageDriveTier.COLD_STORAGE };
    const { action } = captureRequester(askFileWriteBinaryContents('drive', 'path/file.bin', data, options));

    expect(action).toEqual({
      type: FileActionType.WriteBinaryContents,
      payload: { drive: 'drive', filepath: 'path/file.bin', data, storageDriveAdvancedWriteOptions: options },
    });
  });

  it('leaves the write options undefined when omitted', () => {
    const { action } = captureRequester(askFileWriteBinaryContents('drive', 'path/file.bin', data));

    expect(action.payload).toEqual({ drive: 'drive', filepath: 'path/file.bin', data, storageDriveAdvancedWriteOptions: undefined });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askFileWriteBinaryContents('drive', 'path/file.bin', data), undefined);

    expect(returned).toBeUndefined();
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileWriteBinaryContents('drive', 'path/file.bin', data, undefined, 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
