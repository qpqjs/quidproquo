import {
  buildTestQpqConfig,
  buildTestStorySession,
  DecodedAccessToken,
  ErrorTypeEnum,
  isErroredActionResult,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getUserDirectoryReadAccessTokenActionProcessor } from './getUserDirectoryReadAccessTokenActionProcessor';

const nowInSeconds = Math.floor(Date.now() / 1000);

const buildDecodedToken = (exp: number): DecodedAccessToken => ({
  userId: 'user-1',
  username: 'joe@example.com',
  exp,
  wasValid: true,
  userDirectory: 'directory',
});

const base64UrlEncode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');
const buildJwtWithPayload = (payload: object): string => `${base64UrlEncode({ alg: 'none' })}.${base64UrlEncode(payload)}.dev-signature`;

const getProcessor = async () => {
  const processors = await getUserDirectoryReadAccessTokenActionProcessor(buildTestQpqConfig([]), noopDynamicModuleLoader);
  return processors[UserDirectoryActionType.ReadAccessToken];
};

describe('getUserDirectoryReadAccessTokenActionProcessor', () => {
  it('returns the session-cached decoded token while it is still valid', async () => {
    const decodedAccessToken = buildDecodedToken(nowInSeconds + 3600);
    const process = await getProcessor();

    const result = await invokeProcessor(
      process,
      { userDirectoryName: 'directory', ignoreExpiration: false },
      buildTestStorySession({ decodedAccessToken }),
    );

    expect(resolveActionResult(result)).toEqual(decodedAccessToken);
  });

  it('rejects an unverified session-cached token even while it is unexpired', async () => {
    const decodedAccessToken = { ...buildDecodedToken(nowInSeconds + 3600), wasValid: false };
    const process = await getProcessor();

    const result = await invokeProcessor(
      process,
      { userDirectoryName: 'directory', ignoreExpiration: false },
      buildTestStorySession({ decodedAccessToken }),
    );

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.Unauthorized);
  });

  it('rejects an expired session-cached token when expiration is enforced', async () => {
    const decodedAccessToken = buildDecodedToken(nowInSeconds - 60);
    const process = await getProcessor();

    const result = await invokeProcessor(
      process,
      { userDirectoryName: 'directory', ignoreExpiration: false },
      buildTestStorySession({ decodedAccessToken }),
    );

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.Invalid);
  });

  it('returns an expired session-cached token when ignoreExpiration is true', async () => {
    const decodedAccessToken = buildDecodedToken(nowInSeconds - 60);
    const process = await getProcessor();

    const result = await invokeProcessor(
      process,
      { userDirectoryName: 'directory', ignoreExpiration: true },
      buildTestStorySession({ decodedAccessToken }),
    );

    expect(resolveActionResult(result)).toEqual(decodedAccessToken);
  });

  it('treats a cached dev token without an exp claim as non-expiring', async () => {
    const decodedAccessToken = buildDecodedToken(0);
    const process = await getProcessor();

    const result = await invokeProcessor(
      process,
      { userDirectoryName: 'directory', ignoreExpiration: false },
      buildTestStorySession({ decodedAccessToken }),
    );

    expect(resolveActionResult(result)).toEqual(decodedAccessToken);
  });

  it('decodes the session access token when no decoded token is cached', async () => {
    const accessToken = buildJwtWithPayload({ sub: 'user-1', username: 'joe@example.com', exp: nowInSeconds + 3600 });
    const process = await getProcessor();

    const result = await invokeProcessor(
      process,
      { userDirectoryName: 'directory', ignoreExpiration: false },
      buildTestStorySession({ accessToken }),
    );

    expect(resolveActionResult(result).username).toBe('joe@example.com');
  });

  it('returns Unauthorized when the session carries no token at all', async () => {
    const process = await getProcessor();

    const result = await invokeProcessor(process, { userDirectoryName: 'directory', ignoreExpiration: false }, buildTestStorySession());

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.Unauthorized);
  });
});
