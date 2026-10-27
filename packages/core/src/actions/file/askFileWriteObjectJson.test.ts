import { describe, expect, it } from 'vitest';

import { StorageDriveTier } from '../../config';
import { captureRequester } from '../../testing';
import { askFileWriteObjectJson } from './askFileWriteObjectJson';
import { FileActionType } from './FileActionType';

describe('askFileWriteObjectJson', () => {
  it('yields a WriteObjectJson action carrying the drive, filepath, data and write options', () => {
    const data = { hello: 'world' };
    const options = { storageDriveTier: StorageDriveTier.REGULAR };
    const { action } = captureRequester(askFileWriteObjectJson('drive', 'path/file.json', data, options));

    expect(action).toEqual({
      type: FileActionType.WriteObjectJson,
      payload: { drive: 'drive', filepath: 'path/file.json', data, storageDriveAdvancedWriteOptions: options },
    });
  });

  it('leaves the write options undefined when omitted', () => {
    const data = { hello: 'world' };
    const { action } = captureRequester(askFileWriteObjectJson('drive', 'path/file.json', data));

    expect(action.payload).toEqual({ drive: 'drive', filepath: 'path/file.json', data, storageDriveAdvancedWriteOptions: undefined });
  });

  it('returns the value the runtime resolves', () => {
    const data = { hello: 'world' };
    const { returned } = captureRequester(askFileWriteObjectJson('drive', 'path/file.json', data), undefined);

    expect(returned).toBeUndefined();
  });

  it('forwards the scope onto the payload', () => {
    const data = { hello: 'world' };
    const { action } = captureRequester(askFileWriteObjectJson('drive', 'path/file.json', data, undefined, 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
