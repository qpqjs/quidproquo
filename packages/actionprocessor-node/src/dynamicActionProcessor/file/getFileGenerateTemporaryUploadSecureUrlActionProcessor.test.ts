import {
  askFileGenerateTemporaryUploadSecureUrl,
  ErrorTypeEnum,
  FileActionType,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileGenerateTemporaryUploadSecureUrlActionProcessor } from './getFileGenerateTemporaryUploadSecureUrlActionProcessor';
import { verifySecureUrlToken } from './secureUrlUtils';

const invoke = (filepath: string, expirationMs: number = 60_000) =>
  runFileAction(getFileGenerateTemporaryUploadSecureUrlActionProcessor(fileConfig), FileActionType.GenerateTemporaryUploadSecureUrl, {
    filepath,
    expirationMs,
    contentType: 'image/png',
  });

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getFileGenerateTemporaryUploadSecureUrlActionProcessor', () => {
  it('returns a signed upload url carrying the content type', async () => {
    const result = await invoke('a.png');

    const url = resolveActionResult(result) as string;
    expect(url.startsWith('http://localhost:4000/secure-upload?token=')).toBe(true);

    const token = url.split('token=')[1];
    const decoded = verifySecureUrlToken(token, fileConfig.secureUrlSecret);
    expect(decoded?.operation).toBe('upload');
    expect(decoded?.contentType).toBe('image/png');
  });

  it('returns GenericError when the path cannot be resolved', async () => {
    const result = await invoke('/etc/passwd');

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });

  it('rejects an expiry beyond the 7 day presigned limit, matching the AWS processor', async () => {
    const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
    const result = await invoke('a.png', eightDaysMs);

    expect(resolveActionResultError(result).errorType).toBe(askFileGenerateTemporaryUploadSecureUrl.errorType.ExpirationTooLong);
  });
});
