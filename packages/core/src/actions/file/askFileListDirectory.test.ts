import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askFileListDirectory } from './askFileListDirectory';
import { FileActionType } from './FileActionType';

describe('askFileListDirectory', () => {
  it('yields a ListDirectory action carrying the drive, folder, page token and max files', () => {
    const { action } = captureRequester(askFileListDirectory('drive', 'folder', 50, 'next'));

    expect(action).toEqual({
      type: FileActionType.ListDirectory,
      payload: { drive: 'drive', folderPath: 'folder', pageToken: 'next', maxFiles: 50 },
    });
  });

  it('defaults maxFiles to 1000 and leaves the page token undefined when omitted', () => {
    const { action } = captureRequester(askFileListDirectory('drive', 'folder'));

    expect(action.payload).toEqual({ drive: 'drive', folderPath: 'folder', pageToken: undefined, maxFiles: 1000 });
  });

  it('returns the value the runtime resolves', () => {
    const directoryInfo = { fileInfos: [], pageToken: undefined };
    const { returned } = captureRequester(askFileListDirectory('drive', 'folder'), directoryInfo);

    expect(returned).toBe(directoryInfo);
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileListDirectory('drive', 'folder', 1000, undefined, 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
