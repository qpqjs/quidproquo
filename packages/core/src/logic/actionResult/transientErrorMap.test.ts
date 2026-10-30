import { describe, expect, it } from 'vitest';

import { ErrorTypeEnum } from '../../types/ErrorTypeEnum';
import { actionResultErrorFromCaughtError } from './actionResultErrorFromCaughtError';
import { isTransientErrorName, transientErrorMap } from './transientErrorMap';

const named = (name: string) => Object.assign(new Error(name), { name });

describe('transientErrorMap', () => {
  it('classifies a throttle as OutOfResources only when spread into the map', () => {
    const [, plain] = actionResultErrorFromCaughtError(named('ThrottlingException'));
    const [, classified] = actionResultErrorFromCaughtError(named('ThrottlingException'), { ...transientErrorMap() });

    expect(plain?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(classified?.errorType).toBe(ErrorTypeEnum.OutOfResources);
    expect(classified?.errorText).toContain('ThrottlingException');
  });

  it("lets the processor's own entry win over the spread", () => {
    const [, error] = actionResultErrorFromCaughtError(named('TooManyRequestsException'), {
      ...transientErrorMap(),
      TooManyRequestsException: () => [undefined, { errorType: 'Users::LimitExceeded', errorText: 'slow down' }],
    });

    expect(error?.errorType).toBe('Users::LimitExceeded');
  });

  it('maps to the catalogued throttle entry it is given', () => {
    const [, error] = actionResultErrorFromCaughtError(named('ECONNRESET'), transientErrorMap('Files::Throttled'));

    expect(error?.errorType).toBe('Files::Throttled');
  });

  it('names the transient conditions', () => {
    expect(isTransientErrorName('ProvisionedThroughputExceededException')).toBe(true);
    expect(isTransientErrorName('NoSuchBucket')).toBe(false);
    expect(isTransientErrorName(undefined)).toBe(false);
  });
});
