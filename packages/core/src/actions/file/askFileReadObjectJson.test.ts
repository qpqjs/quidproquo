import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askFileReadObjectJson } from './askFileReadObjectJson';
import { FileActionType } from './FileActionType';

describe('askFileReadObjectJson', () => {
  it('yields a ReadObjectJson action carrying the drive and filepath', () => {
    const { action } = captureRequester(askFileReadObjectJson('drive', 'path/file.json'));

    expect(action).toEqual({
      type: FileActionType.ReadObjectJson,
      payload: { drive: 'drive', filepath: 'path/file.json' },
    });
  });

  it('returns the parsed object the runtime resolves', () => {
    const parsed = { hello: 'world' };
    const { returned } = captureRequester(askFileReadObjectJson('drive', 'path/file.json'), parsed);

    expect(returned).toBe(parsed);
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileReadObjectJson('drive', 'path/file.json', 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
