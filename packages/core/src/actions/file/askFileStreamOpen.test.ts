import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askFileStreamOpen } from './askFileStreamOpen';
import { FileActionType } from './FileActionType';

describe('askFileStreamOpen', () => {
  it('yields a StreamOpen action carrying drive, path, encoding and chunk size', () => {
    const { action } = captureRequester(askFileStreamOpen('drive', 'path/to/file', 'binary', 1024));

    expect(action).toEqual({
      type: FileActionType.StreamOpen,
      payload: { drive: 'drive', filepath: 'path/to/file', encoding: 'binary', chunkSize: 1024 },
    });
  });

  it('defaults encoding to text and leaves chunk size undefined', () => {
    const { action } = captureRequester(askFileStreamOpen('drive', 'path/to/file'));

    expect(action.payload).toEqual({ drive: 'drive', filepath: 'path/to/file', encoding: 'text', chunkSize: undefined });
  });

  it('returns the handle the runtime resolves', () => {
    const handle = { id: 'stream-1', encoding: 'text' as const };

    const { returned } = captureRequester(askFileStreamOpen('drive', 'path'), handle);

    expect(returned).toBe(handle);
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileStreamOpen('drive', 'path/to/file', 'text', undefined, 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
