import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askUserDirectoryGetUsersByAttribute, defineUserDirectory, UserDirectoryActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { listPagedUsersByAttribute } from '../../../logic/cognito/listPagedUsersByAttribute';
import { getUserDirectoryGetUsersByAttributeActionProcessor } from './getUserDirectoryGetUsersByAttributeActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({ getExportedValue: vi.fn() }));
vi.mock('../../../logic/cognito/listPagedUsersByAttribute', () => ({ listPagedUsersByAttribute: vi.fn() }));

const cognitoError = (name: string) => Object.assign(new Error(name), { name });

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineUserDirectory('users')]);
  const processors = await getUserDirectoryGetUsersByAttributeActionProcessor(config, {} as any);
  return processors[UserDirectoryActionType.GetUsersByAttribute];
};

describe('getUserDirectoryGetUsersByAttributeActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset().mockResolvedValue('POOL');
    vi.mocked(listPagedUsersByAttribute).mockReset();
  });

  it('answers the cognito result', async () => {
    const processor = await resolveProcessor();
    vi.mocked(listPagedUsersByAttribute).mockResolvedValue({ items: [], nextPageKey: null } as any);

    const [result, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      attribueName: 'email',
      attribueValue: 'joe@example.com',
      limit: 10,
      nextPageKey: undefined,
    });

    expect(error).toBeUndefined();
    expect(result).toEqual({ items: [], nextPageKey: null });
    expect(listPagedUsersByAttribute).toHaveBeenCalledWith('POOL', 'eu-west-1', 'email', 'joe@example.com', 10, undefined);
  });

  it('maps InvalidParameterException to InvalidSearchParameters', async () => {
    const processor = await resolveProcessor();
    vi.mocked(listPagedUsersByAttribute).mockRejectedValue(cognitoError('InvalidParameterException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      attribueName: 'email',
      attribueValue: 'joe@example.com',
      limit: 10,
      nextPageKey: undefined,
    });

    expect(error?.errorType).toBe(askUserDirectoryGetUsersByAttribute.errorType.InvalidSearchParameters);
  });

  it('maps INVALID_COGNITO_FILTER to InvalidSearchParameters', async () => {
    const processor = await resolveProcessor();
    vi.mocked(listPagedUsersByAttribute).mockRejectedValue(cognitoError('INVALID_COGNITO_FILTER'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      attribueName: 'email',
      attribueValue: 'joe@example.com',
      limit: 10,
      nextPageKey: undefined,
    });

    expect(error?.errorType).toBe(askUserDirectoryGetUsersByAttribute.errorType.InvalidSearchParameters);
  });

  it('maps TooManyRequestsException to LimitExceeded', async () => {
    const processor = await resolveProcessor();
    vi.mocked(listPagedUsersByAttribute).mockRejectedValue(cognitoError('TooManyRequestsException'));

    const [, error] = await invokeProcessor(processor!, {
      userDirectoryName: 'users',
      attribueName: 'email',
      attribueValue: 'joe@example.com',
      limit: 10,
      nextPageKey: undefined,
    });

    expect(error?.errorType).toBe(askUserDirectoryGetUsersByAttribute.errorType.LimitExceeded);
  });
});
