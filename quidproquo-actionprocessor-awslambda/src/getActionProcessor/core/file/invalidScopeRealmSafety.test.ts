import { askFileGenerateTemporarySecureUrl, askFileGenerateTemporaryUploadSecureUrl, buildTestQpqConfig, FileActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileGenerateTemporarySecureUrlActionProcessor } from './getFileGenerateTemporarySecureUrlActionProcessor';
import { getFileGenerateTemporaryUploadSecureUrlActionProcessor } from './getFileGenerateTemporaryUploadSecureUrlActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));

// Under npm link or module federation two copies of quidproquo-core can load,
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
    const processor = (await getFileGenerateTemporarySecureUrlActionProcessor(buildTestQpqConfig(), null as any))[
      FileActionType.GenerateTemporarySecureUrl
    ];

    const [, error] = await invokeProcessor(processor, { drive: 'assets', filepath: 'a.txt', expirationMs: 1000, scope: 'bad' });

    expect(error?.errorType).toBe(askFileGenerateTemporarySecureUrl.errorType.InvalidScope);
  });

  it('maps a foreign-realm InvalidScopeError in generate upload secure url', async () => {
    const processor = (await getFileGenerateTemporaryUploadSecureUrlActionProcessor(buildTestQpqConfig(), null as any))[
      FileActionType.GenerateTemporaryUploadSecureUrl
    ];

    const [, error] = await invokeProcessor(
      processor,
      { drive: 'assets', filepath: 'a.txt', expirationMs: 1000, contentType: 'text/plain', scope: 'bad' },
      { session: { correlation: 'corr-1' } },
    );

    expect(error?.errorType).toBe(askFileGenerateTemporaryUploadSecureUrl.errorType.InvalidScope);
  });
});
