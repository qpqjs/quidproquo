import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askThrowError } from './askThrowError';
import { ErrorActionType } from './ErrorActionType';

describe('askThrowError', () => {
  it('yields a ThrowError action carrying the error fields', () => {
    const { action } = captureRequester(askThrowError('NotFound', 'no such thing', 'at line 1'));

    expect(action).toEqual({
      type: ErrorActionType.ThrowError,
      payload: { errorType: 'NotFound', errorText: 'no such thing', errorStack: 'at line 1' },
    });
  });

  it('leaves the stack undefined when none is given', () => {
    const { action } = captureRequester(askThrowError('NotFound', 'no such thing'));

    expect(action.payload).toEqual({ errorType: 'NotFound', errorText: 'no such thing', errorStack: undefined });
  });
});
