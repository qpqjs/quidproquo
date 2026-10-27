import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askFileDelete } from './askFileDelete';
import { FileActionType } from './FileActionType';

describe('askFileDelete', () => {
  it('yields a Delete action carrying the drive and filepaths', () => {
    const { action } = captureRequester(askFileDelete('drive', ['a.txt', 'b.txt']));

    expect(action).toEqual({
      type: FileActionType.Delete,
      payload: { drive: 'drive', filepaths: ['a.txt', 'b.txt'] },
    });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askFileDelete('drive', ['a.txt']), undefined);

    expect(returned).toBeUndefined();
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileDelete('drive', ['a.txt'], 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
