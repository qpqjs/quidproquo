import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askFileGenerateTemporaryUploadSecureUrl } from './askFileGenerateTemporaryUploadSecureUrl';
import { FileActionType } from './FileActionType';

describe('askFileGenerateTemporaryUploadSecureUrl', () => {
  it('yields a GenerateTemporaryUploadSecureUrl action carrying the advanced content type', () => {
    const { action } = captureRequester(askFileGenerateTemporaryUploadSecureUrl('drive', 'path/file.txt', 60000, { contentType: 'image/png' }));

    expect(action).toEqual({
      type: FileActionType.GenerateTemporaryUploadSecureUrl,
      payload: { drive: 'drive', filepath: 'path/file.txt', expirationMs: 60000, contentType: 'image/png' },
    });
  });

  it('leaves the content type undefined when no advanced options are given', () => {
    const { action } = captureRequester(askFileGenerateTemporaryUploadSecureUrl('drive', 'path/file.txt', 60000));

    expect(action.payload).toEqual({ drive: 'drive', filepath: 'path/file.txt', expirationMs: 60000, contentType: undefined });
  });

  it('returns the url the runtime resolves', () => {
    const { returned } = captureRequester(askFileGenerateTemporaryUploadSecureUrl('drive', 'path/file.txt', 60000), 'https://upload');

    expect(returned).toBe('https://upload');
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileGenerateTemporaryUploadSecureUrl('drive', 'path/file.txt', 60000, undefined, 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
