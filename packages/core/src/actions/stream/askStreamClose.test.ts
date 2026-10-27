import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { StreamHandle } from '../../types/StreamRegistry';
import { askStreamClose } from './askStreamClose';
import { StreamActionType } from './StreamActionType';

describe('askStreamClose', () => {
  it('yields a Close action carrying the stream id', () => {
    const handle: StreamHandle = { id: 'stream-1', encoding: 'text' };

    const { action } = captureRequester(askStreamClose(handle));

    expect(action).toEqual({
      type: StreamActionType.Close,
      payload: { streamId: 'stream-1' },
    });
  });

  it('returns the value the runtime resolves', () => {
    const handle: StreamHandle = { id: 'stream-1', encoding: 'text' };

    const { returned } = captureRequester(askStreamClose(handle), undefined);

    expect(returned).toBeUndefined();
  });
});
