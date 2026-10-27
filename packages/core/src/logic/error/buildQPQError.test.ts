import { describe, expect, it } from 'vitest';

import { ErrorTypeEnum } from '../../types';
import { buildQPQError } from './buildQPQError';

describe('buildQPQError', () => {
  it('assembles the error fields including the stack', () => {
    expect(buildQPQError(ErrorTypeEnum.NotFound, 'gone', 'at line 1')).toEqual({
      errorType: ErrorTypeEnum.NotFound,
      errorText: 'gone',
      errorStack: 'at line 1',
    });
  });

  it('leaves the stack undefined when not provided', () => {
    expect(buildQPQError(ErrorTypeEnum.BadRequest, 'nope')).toEqual({
      errorType: ErrorTypeEnum.BadRequest,
      errorText: 'nope',
      errorStack: undefined,
    });
  });
});
