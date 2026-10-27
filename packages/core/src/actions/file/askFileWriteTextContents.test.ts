import { describe, expect, it } from 'vitest';

import { StorageDriveTier } from '../../config';
import { captureRequester } from '../../testing';
import { askFileWriteTextContents } from './askFileWriteTextContents';
import { FileActionType } from './FileActionType';

describe('askFileWriteTextContents', () => {
  it('yields a WriteTextContents action carrying the drive, filepath, data and write options', () => {
    const options = { storageDriveTier: StorageDriveTier.REGULAR };
    const { action } = captureRequester(askFileWriteTextContents('drive', 'path/file.txt', 'file body', options));

    expect(action).toEqual({
      type: FileActionType.WriteTextContents,
      payload: { drive: 'drive', filepath: 'path/file.txt', data: 'file body', storageDriveAdvancedWriteOptions: options },
    });
  });

  it('leaves the write options undefined when omitted', () => {
    const { action } = captureRequester(askFileWriteTextContents('drive', 'path/file.txt', 'file body'));

    expect(action.payload).toEqual({ drive: 'drive', filepath: 'path/file.txt', data: 'file body', storageDriveAdvancedWriteOptions: undefined });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askFileWriteTextContents('drive', 'path/file.txt', 'file body'), undefined);

    expect(returned).toBeUndefined();
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileWriteTextContents('drive', 'path/file.txt', 'file body', undefined, 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
