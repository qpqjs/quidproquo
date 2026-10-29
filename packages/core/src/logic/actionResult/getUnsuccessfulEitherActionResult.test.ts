import { describe, expect, it } from 'vitest';

import { ErrorTypeEnum } from '../../types';
import { getUnsuccessfulEitherActionResult } from './getUnsuccessfulEitherActionResult';

describe('getUnsuccessfulEitherActionResult', () => {
  it('wraps an error as a failed result', () => {
    const error = { errorType: ErrorTypeEnum.NotFound, errorText: 'missing' };

    expect(getUnsuccessfulEitherActionResult(error)).toEqual({ success: false, error });
  });
});
