import {
  defineUserDirectory,
  ErrorTypeEnum,
  isErroredActionResult,
  resolveActionResult,
  resolveActionResultError,
  UserDirectoryActionType,
} from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildTestDevServerConfig } from '../../../__fixtures__/buildTestDevServerConfig';
import { decodeAccessTokenForDev } from '../../../logic/auth/decodeAccessTokenForDev';
import { getUserDirectoryDecodeAccessTokenActionProcessor } from './getUserDirectoryDecodeAccessTokenActionProcessor';

vi.mock('../../../logic/auth/decodeAccessTokenForDev', () => ({
  decodeAccessTokenForDev: vi.fn(),
}));
vi.mock('../../../logic/auth/devJwtSecret', () => ({ getOrSeedDevJwtSecret: vi.fn(async () => 'test-secret') }));

const mockedDecode = vi.mocked(decodeAccessTokenForDev);

describe('getUserDirectoryDecodeAccessTokenActionProcessor', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const getProcess = async () => {
    const processors = await getUserDirectoryDecodeAccessTokenActionProcessor(buildTestDevServerConfig())(
      buildTestQpqConfig([defineUserDirectory('pool')]),
      noopDynamicModuleLoader,
    );
    return processors[UserDirectoryActionType.DecodeAccessToken];
  };

  it('returns the decoded token and forwards the request fields', async () => {
    const decoded = { sub: 'user-1' } as any;
    mockedDecode.mockReturnValue(decoded);
    const process = await getProcess();

    const result = await invokeProcessor(process!, { userDirectoryName: 'pool', accessToken: 'token-abc', ignoreExpiration: true });

    expect(mockedDecode).toHaveBeenCalledWith('test-secret', 'pool', 'token-abc', true);
    expect(resolveActionResult(result)).toBe(decoded);
  });

  it('returns an Unauthorized error when the token cannot be decoded', async () => {
    mockedDecode.mockReturnValue(null as any);
    const process = await getProcess();

    const result = await invokeProcessor(process!, { userDirectoryName: 'pool', accessToken: 'bad', ignoreExpiration: false });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.Unauthorized);
    expect(resolveActionResultError(result).errorText).toBe('Invalid access token');
  });
});
