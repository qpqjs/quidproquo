import { describe, expect, it, vi } from 'vitest';

import { ErrorTypeEnum } from '../types';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  getSuccessfulEitherActionResult,
  getUnsuccessfulEitherActionResult,
  isErroredActionResult,
  resolveActionResult,
  resolveActionResultError,
} from './actionLogic';

describe('getSuccessfulEitherActionResult', () => {
  it('wraps a value as a successful result', () => {
    expect(getSuccessfulEitherActionResult(42)).toEqual({ success: true, result: 42 });
  });
});

describe('getUnsuccessfulEitherActionResult', () => {
  it('wraps an error as a failed result', () => {
    const error = { errorType: ErrorTypeEnum.NotFound, errorText: 'missing' };

    expect(getUnsuccessfulEitherActionResult(error)).toEqual({ success: false, error });
  });
});

describe('actionResult', () => {
  it('returns a single-element tuple with the result', () => {
    expect(actionResult('ok')).toEqual(['ok']);
  });
});

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

describe('isErroredActionResult', () => {
  it('is false for a successful result', () => {
    expect(isErroredActionResult(['value'])).toBe(false);
  });

  it('is true when an error is present', () => {
    expect(isErroredActionResult([undefined, { errorType: ErrorTypeEnum.GenericError, errorText: 'x' }])).toBe(true);
  });

  it('is true for a missing result tuple', () => {
    expect(isErroredActionResult(undefined as any)).toBe(true);
  });
});

describe('resolveActionResult', () => {
  it('returns the first element of the tuple', () => {
    expect(resolveActionResult([{ a: 1 }])).toEqual({ a: 1 });
  });
});

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

describe('actionResultErrorFromCaughtError', () => {
  it('delegates to the matching handler by error name', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = Object.assign(new Error('boom'), { name: 'ConditionalCheckFailed' });

    const result = actionResultErrorFromCaughtError(error, {
      ConditionalCheckFailed: () => actionResultError(ErrorTypeEnum.Conflict, 'mapped'),
    });

    expect(result).toEqual([undefined, { errorType: ErrorTypeEnum.Conflict, errorText: 'mapped', errorStack: undefined }]);
    vi.restoreAllMocks();
  });

  it('falls back to a generic error embedding the unmapped name', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = Object.assign(new Error('boom'), { name: 'SomeUnknownAwsError' });

    const [, qpqError] = actionResultErrorFromCaughtError(error, {});

    expect(qpqError?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(qpqError?.errorText).toBe('An unexpected error occurred [SomeUnknownAwsError].');
    vi.restoreAllMocks();
  });

  it('never writes to the console for an unmapped error', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = Object.assign(new Error('boom'), { name: 'SomeUnknownAwsError' });

    actionResultErrorFromCaughtError(error, {});

    expect(log).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('logs nothing when a handler matches', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = Object.assign(new Error('boom'), { name: 'Mapped' });

    actionResultErrorFromCaughtError(error, { Mapped: () => actionResultError(ErrorTypeEnum.Conflict, 'mapped') });

    expect(log).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('prefers the runtime error code over the error name when both are mapped', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = Object.assign(new Error('denied'), { name: 'SomeWrapperName', code: 'EACCES' });

    const result = actionResultErrorFromCaughtError(error, {
      EACCES: () => actionResultError(ErrorTypeEnum.Forbidden, 'by code'),
      SomeWrapperName: () => actionResultError(ErrorTypeEnum.GenericError, 'by name'),
    });

    expect(result).toEqual([undefined, { errorType: ErrorTypeEnum.Forbidden, errorText: 'by code', errorStack: undefined }]);
    vi.restoreAllMocks();
  });

  it('falls back to the error name when the code has no handler', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = Object.assign(new Error('missing'), { name: 'NoSuchBucket', code: 'SomethingUnmapped' });

    const result = actionResultErrorFromCaughtError(error, {
      NoSuchBucket: () => actionResultError(ErrorTypeEnum.NotFound, 'by name'),
    });

    expect(result).toEqual([undefined, { errorType: ErrorTypeEnum.NotFound, errorText: 'by name', errorStack: undefined }]);
    vi.restoreAllMocks();
  });

  it('reports the unmapped code, not the name, when neither is handled', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = Object.assign(new Error('boom'), { name: 'WrapperError', code: 'ENOENT' });

    const [, qpqError] = actionResultErrorFromCaughtError(error, {});

    expect(qpqError?.errorText).toBe('An unexpected error occurred [ENOENT].');
    vi.restoreAllMocks();
  });

  it('never leaks the raw error message into the generic fallback', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = Object.assign(new Error('secret connection string in message'), { name: 'UnmappedError' });

    const [, qpqError] = actionResultErrorFromCaughtError(error, {});

    expect(qpqError?.errorText).not.toContain('secret connection string');
    vi.restoreAllMocks();
  });

  it('handles a thrown non-error value', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const [, qpqError] = actionResultErrorFromCaughtError('just a string', {});

    expect(qpqError).toEqual({ errorType: ErrorTypeEnum.GenericError, errorText: 'An unknown error occurred.', errorStack: undefined });
    vi.restoreAllMocks();
  });
});
