import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askEmailParse } from './askEmailParse';
import { EmailActionType } from './EmailActionType';

describe('askEmailParse', () => {
  it('yields a Parse action carrying the raw message', () => {
    const { action } = captureRequester(askEmailParse('aGVsbG8='));

    expect(action).toEqual({ type: EmailActionType.Parse, payload: { rawBase64: 'aGVsbG8=' } });
  });
});
