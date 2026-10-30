import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { QPQ_LOGS_STORAGE_DRIVE_NAME, StoryResult } from '@qpqjs/core';
import { buildStoryResult, buildTestQpqConfig } from '@qpqjs/testing';

import * as fs from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTestDevServerConfig } from '../__fixtures__/buildTestDevServerConfig';
import { ResolvedDevServerConfig } from '../types';
import { getDevServerLogger } from './logger';

vi.mock('fs/promises', () => ({
  mkdir: vi.fn(async () => undefined),
  writeFile: vi.fn(async () => undefined),
}));

const buildDevServerConfig = (overrides: Partial<ResolvedDevServerConfig> = {}) =>
  buildTestDevServerConfig({ logServiceName: 'svc-a', ...overrides });

const buildResult = (overrides: Partial<StoryResult<unknown[]>> = {}) => buildStoryResult({ correlation: 'corr-123', ...overrides });

describe('getDevServerLogger', () => {
  const originalStorageDriveName = process.env.storageDriveName;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.storageDriveName;
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.storageDriveName = originalStorageDriveName;
    vi.restoreAllMocks();
  });

  it('returns a no-op logger that never writes when logServiceName is missing', async () => {
    const logger = getDevServerLogger([], buildDevServerConfig({ logServiceName: undefined }));

    logger.log(buildResult());
    await logger.enableLogs(true, 'reason', 'corr-123');
    await logger.waitToFinishWriting();
    await logger.moveToPermanentStorage();

    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('returns a no-op logger when the service turns its logs off with disableLogs', async () => {
    const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'us-test-1', [], { disableLogs: true })]);
    const logger = getDevServerLogger(qpqConfig, buildDevServerConfig());

    logger.log(buildResult());
    await logger.waitToFinishWriting();

    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('keeps writing when the service leaves disableLogs off', async () => {
    const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'us-test-1', [], { disableLogs: false })]);
    const logger = getDevServerLogger(qpqConfig, buildDevServerConfig());

    logger.log(buildResult());
    await logger.waitToFinishWriting();

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('returns a no-op logger when processing a qpq-logs drive storage event', async () => {
    const storySession = { depth: 0, context: { storageEvent: { drive: QPQ_LOGS_STORAGE_DRIVE_NAME } } } as any;
    const logger = getDevServerLogger([], buildDevServerConfig(), storySession);

    logger.log(buildResult());
    await logger.waitToFinishWriting();

    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('returns a no-op logger when env storageDriveName is the qpq-logs drive', async () => {
    process.env.storageDriveName = QPQ_LOGS_STORAGE_DRIVE_NAME;
    const logger = getDevServerLogger([], buildDevServerConfig());

    logger.log(buildResult());
    await logger.waitToFinishWriting();

    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('writes the result json to a path containing the correlation', async () => {
    const logger = getDevServerLogger([], buildDevServerConfig());

    logger.log(buildResult({ correlation: 'abc-789' }) as any);
    await logger.waitToFinishWriting();

    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect((fs.writeFile as any).mock.calls[0][0]).toContain('abc-789');
  });

  it('still writes after a correlation is disabled, filtering its history', async () => {
    const logger = getDevServerLogger([], buildDevServerConfig());

    await logger.enableLogs(false, 'noisy', 'corr-123');
    logger.log(buildResult());
    await logger.waitToFinishWriting();

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('treats moveToPermanentStorage as a no-op', async () => {
    const logger = getDevServerLogger([], buildDevServerConfig());

    await logger.moveToPermanentStorage();

    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});
