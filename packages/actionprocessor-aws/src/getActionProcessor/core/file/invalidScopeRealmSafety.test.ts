import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askFileGenerateTemporarySecureUrl, askFileGenerateTemporaryUploadSecureUrl, FileActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { getFileGenerateTemporarySecureUrlActionProcessor } from './getFileGenerateTemporarySecureUrlActionProcessor';
import { getFileGenerateTemporaryUploadSecureUrlActionProcessor } from './getFileGenerateTemporaryUploadSecureUrlActionProcessor';

// Under npm link or module federation two copies of @qpqjs/core can load,
// and an InvalidScopeError thrown by the OTHER copy fails instanceof while
// keeping its explicit `.name`. These processors must map it by name (the
// actionResultErrorFromCaughtError chokepoint), never by prototype, or a scope
// violation degrades to GenericError.
vi.mock('./utils', () => ({
  resolveStorageDriveBucketName: vi.fn(() => {
    throw Object.assign(new Error('Scope must not contain ":".'), { name: 'InvalidScopeError', code: 'unsafeCharacters' });
  }),
}));

describe('InvalidScopeError realm safety (name-keyed, not instanceof)', () => {
  it('maps a foreign-realm InvalidScopeError in generate secure url', async () => {
    const processor = (
      await getFileGenerateTemporarySecureUrlActionProcessor(
        buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'us-test-1')]),
        null as any,
      )
    )[FileActionType.GenerateTemporarySecureUrl];

    const [, error] = await invokeProcessor(processor!, { drive: 'assets', filepath: 'a.txt', expirationMs: 1000, scope: 'bad' });

    expect(error?.errorType).toBe(askFileGenerateTemporarySecureUrl.errorType.InvalidScope);
  });

  it('maps a foreign-realm InvalidScopeError in generate upload secure url', async () => {
    const processor = (
      await getFileGenerateTemporaryUploadSecureUrlActionProcessor(
        buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'us-test-1')]),
        null as any,
      )
    )[FileActionType.GenerateTemporaryUploadSecureUrl];

    const [, error] = await invokeProcessor(
      processor!,
      { drive: 'assets', filepath: 'a.txt', expirationMs: 1000, contentType: 'text/plain', scope: 'bad' },
      { session: { correlation: 'corr-1' } },
    );

    expect(error?.errorType).toBe(askFileGenerateTemporaryUploadSecureUrl.errorType.InvalidScope);
  });
});
