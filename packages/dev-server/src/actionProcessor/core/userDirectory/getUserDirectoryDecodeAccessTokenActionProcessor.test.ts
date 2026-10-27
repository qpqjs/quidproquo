import {
  buildTestQpqConfig,
  ErrorTypeEnum,
  isErroredActionResult,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { decodeAccessTokenForDev } from '../../../logic/auth/decodeAccessTokenForDev';
import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getUserDirectoryDecodeAccessTokenActionProcessor } from './getUserDirectoryDecodeAccessTokenActionProcessor';

vi.mock('../../../logic/auth/decodeAccessTokenForDev', () => ({
  decodeAccessTokenForDev: vi.fn(),
}));

const mockedDecode = vi.mocked(decodeAccessTokenForDev);

describe('getUserDirectoryDecodeAccessTokenActionProcessor', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const getProcess = async () => {
    const processors = await getUserDirectoryDecodeAccessTokenActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    return processors[UserDirectoryActionType.DecodeAccessToken];
  };

  it('returns the decoded token and forwards the request fields', async () => {
    const decoded = { sub: 'user-1' } as any;
    mockedDecode.mockReturnValue(decoded);
    const process = await getProcess();

    const result = await invokeProcessor(process, { userDirectoryName: 'pool', accessToken: 'token-abc', ignoreExpiration: true });

    expect(mockedDecode).toHaveBeenCalledWith('pool', 'token-abc', true);
    expect(resolveActionResult(result)).toBe(decoded);
  });

  it('returns an Unauthorized error when the token cannot be decoded', async () => {
    mockedDecode.mockReturnValue(null as any);
    const process = await getProcess();

    const result = await invokeProcessor(process, { userDirectoryName: 'pool', accessToken: 'bad', ignoreExpiration: false });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.Unauthorized);
    expect(resolveActionResultError(result).errorText).toBe('Invalid access token');
  });
});
