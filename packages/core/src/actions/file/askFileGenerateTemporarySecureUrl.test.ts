import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askFileGenerateTemporarySecureUrl } from './askFileGenerateTemporarySecureUrl';
import { FileActionType } from './FileActionType';

describe('askFileGenerateTemporarySecureUrl', () => {
  it('yields a GenerateTemporarySecureUrl action carrying the drive, filepath and expiry', () => {
    const { action } = captureRequester(askFileGenerateTemporarySecureUrl('drive', 'path/file.txt', 60000));

    expect(action).toEqual({
      type: FileActionType.GenerateTemporarySecureUrl,
      payload: { drive: 'drive', filepath: 'path/file.txt', expirationMs: 60000 },
    });
  });

  it('returns the url the runtime resolves', () => {
    const { returned } = captureRequester(askFileGenerateTemporarySecureUrl('drive', 'path/file.txt', 60000), 'https://signed');

    expect(returned).toBe('https://signed');
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileGenerateTemporarySecureUrl('drive', 'path/file.txt', 60000, 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
