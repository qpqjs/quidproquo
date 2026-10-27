import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askFileCopy } from './askFileCopy';
import { FileActionType } from './FileActionType';

describe('askFileCopy', () => {
  it('yields a Copy action carrying both drives and filepaths', () => {
    const { action } = captureRequester(askFileCopy('renders', 'doc-1/assets/a', 'packs', 'doc-2/assets/b'));

    expect(action).toEqual({
      type: FileActionType.Copy,
      payload: { sourceDrive: 'renders', sourceFilepath: 'doc-1/assets/a', targetDrive: 'packs', targetFilepath: 'doc-2/assets/b' },
    });
  });

  it('returns nothing', () => {
    const { returned } = captureRequester(askFileCopy('a', 'x', 'b', 'y'), undefined);

    expect(returned).toBeUndefined();
  });

  it('forwards the scope onto the payload', () => {
    const { action } = captureRequester(askFileCopy('a', 'x', 'b', 'y', 'scope-a'));

    expect(action.payload.scope).toBe('scope-a');
  });
});
