import { describe, expect, it } from 'vitest';

import { ErrorTypeEnum } from '../../types';
import { actionResultError } from './actionResultError';

describe('actionResultError', () => {
  it('returns a tuple with undefined result and the error', () => {
    expect(actionResultError(ErrorTypeEnum.BadRequest, 'bad', 'stack')).toEqual([
      undefined,
      { errorType: ErrorTypeEnum.BadRequest, errorText: 'bad', errorStack: 'stack' },
    ]);
  });

  it('leaves the stack undefined when omitted', () => {
    expect(actionResultError(ErrorTypeEnum.GenericError, 'oops')).toEqual([
      undefined,
      { errorType: ErrorTypeEnum.GenericError, errorText: 'oops', errorStack: undefined },
    ]);
  });
});
