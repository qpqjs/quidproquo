import { describe, expect, it } from 'vitest';

import { ErrorTypeEnum } from '../../types';
import { resolveActionResultError } from './resolveActionResultError';

describe('resolveActionResultError', () => {
  it('returns the error from the tuple', () => {
    const error = { errorType: ErrorTypeEnum.Forbidden, errorText: 'no' };

    expect(resolveActionResultError([undefined, error])).toEqual(error);
  });

  it('returns a generic error when the tuple is missing', () => {
    const result = resolveActionResultError(undefined as any);

    expect(result.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(result.errorText).toContain('Action processor returned no result');
  });
});
