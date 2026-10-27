import { QPQAwsConfigSettingType } from '@qpqjs/config-aws';
import { QPQ_LOGS_STORAGE_DRIVE_NAME } from '@qpqjs/core';

import * as fs from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDevServerLogger } from './logger';

vi.mock('fs/promises', () => ({
  mkdir: vi.fn(async () => undefined),
  writeFile: vi.fn(async () => undefined),
}));

const buildDevServerConfig = (overrides: any = {}): any => ({
  logServiceName: 'svc-a',
  fileStorageConfig: { storagePath: '/tmp/qpq-storage' },
  ...overrides,
});

const buildResult = (overrides: any = {}) => ({ correlation: 'corr-123', history: [], ...overrides });

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

    logger.log(buildResult() as any);
    await logger.enableLogs(true, 'reason', 'corr-123');
    await logger.waitToFinishWriting();
    await logger.moveToPermanentStorage();

    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('returns a no-op logger when the service turns its logs off with disableLogs', async () => {
    const qpqConfig = [{ configSettingType: QPQAwsConfigSettingType.awsServiceAccountInfo, disableLogs: true }] as any;
    const logger = getDevServerLogger(qpqConfig, buildDevServerConfig());

    logger.log(buildResult() as any);
    await logger.waitToFinishWriting();

    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('keeps writing when the service leaves disableLogs off', async () => {
    const qpqConfig = [{ configSettingType: QPQAwsConfigSettingType.awsServiceAccountInfo, disableLogs: false }] as any;
    const logger = getDevServerLogger(qpqConfig, buildDevServerConfig());

    logger.log(buildResult() as any);
    await logger.waitToFinishWriting();

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('returns a no-op logger when processing a qpq-logs drive storage event', async () => {
    const storySession = { depth: 0, context: { storageEvent: { drive: QPQ_LOGS_STORAGE_DRIVE_NAME } } } as any;
    const logger = getDevServerLogger([], buildDevServerConfig(), storySession);

    logger.log(buildResult() as any);
    await logger.waitToFinishWriting();

    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('returns a no-op logger when env storageDriveName is the qpq-logs drive', async () => {
    process.env.storageDriveName = QPQ_LOGS_STORAGE_DRIVE_NAME;
    const logger = getDevServerLogger([], buildDevServerConfig());

    logger.log(buildResult() as any);
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
    logger.log(buildResult() as any);
    await logger.waitToFinishWriting();

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('treats moveToPermanentStorage as a no-op', async () => {
    const logger = getDevServerLogger([], buildDevServerConfig());

    await logger.moveToPermanentStorage();

    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});
