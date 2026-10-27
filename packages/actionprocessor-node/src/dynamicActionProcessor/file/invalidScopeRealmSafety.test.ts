import {
  askFileDelete,
  askFileExists,
  askFileGenerateTemporarySecureUrl,
  askFileGenerateTemporaryUploadSecureUrl,
  FileActionType,
  resolveActionResultError,
} from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileDeleteActionProcessor } from './getFileDeleteActionProcessor';
import { getFileExistsActionProcessor } from './getFileExistsActionProcessor';
import { getFileGenerateTemporarySecureUrlActionProcessor } from './getFileGenerateTemporarySecureUrlActionProcessor';
import { getFileGenerateTemporaryUploadSecureUrlActionProcessor } from './getFileGenerateTemporaryUploadSecureUrlActionProcessor';

// Under npm link or module federation two copies of quidproquo-core can load,
// and an InvalidScopeError thrown by the OTHER copy fails instanceof while
// keeping its explicit `.name`. These processors must map it by name (the
// actionResultErrorFromCaughtError chokepoint), never by prototype, or a scope
// violation degrades to GenericError.
vi.mock('./utils', () => ({
  resolveFilePath: vi.fn(() => {
    throw Object.assign(new Error('Scope must not contain ":".'), { name: 'InvalidScopeError', code: 'unsafeCharacters' });
  }),
}));

describe('InvalidScopeError realm safety (name-keyed, not instanceof)', () => {
  it('maps a foreign-realm InvalidScopeError in file exists', async () => {
    const result = await runFileAction(getFileExistsActionProcessor(fileConfig), FileActionType.Exists, { filepath: 'a.txt', scope: 'bad' });

    expect(resolveActionResultError(result).errorType).toBe(askFileExists.errorType.InvalidScope);
  });

  it('maps a foreign-realm InvalidScopeError in generate secure url', async () => {
    const result = await runFileAction(getFileGenerateTemporarySecureUrlActionProcessor(fileConfig), FileActionType.GenerateTemporarySecureUrl, {
      filepath: 'a.txt',
      expirationMs: 1000,
      scope: 'bad',
    });

    expect(resolveActionResultError(result).errorType).toBe(askFileGenerateTemporarySecureUrl.errorType.InvalidScope);
  });

  it('maps a foreign-realm InvalidScopeError in generate upload secure url', async () => {
    const result = await runFileAction(
      getFileGenerateTemporaryUploadSecureUrlActionProcessor(fileConfig),
      FileActionType.GenerateTemporaryUploadSecureUrl,
      { filepath: 'a.txt', expirationMs: 1000, contentType: 'text/plain', scope: 'bad' },
    );

    expect(resolveActionResultError(result).errorType).toBe(askFileGenerateTemporaryUploadSecureUrl.errorType.InvalidScope);
  });

  it('maps a foreign-realm InvalidScopeError in file delete', async () => {
    const result = await runFileAction(getFileDeleteActionProcessor(fileConfig), FileActionType.Delete, {
      filepaths: ['a.txt'],
      scope: 'bad',
    });

    expect(resolveActionResultError(result).errorType).toBe(askFileDelete.errorType.InvalidScope);
  });
});
