import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { LogActionType, QPQ_LOGS_STORAGE_DRIVE_NAME, StoryResult } from '@qpqjs/core';
import { buildStoryResult, buildTestQpqConfig } from '@qpqjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getLogger } from './getLogger';

// Real aws account config; only the log switches are swapped per test.
let logSettings: { logServiceName?: string; disableLogs?: boolean; instantLogs?: boolean } = {};

const testConfig = () => buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2', [], logSettings)]);

const send = vi.fn();

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = send;
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

const fetchMock = vi.fn();

const storyResult = (overrides: Partial<StoryResult<unknown[]>> = {}): StoryResult<unknown[]> => buildStoryResult(overrides);

const logAndWait = async (result: StoryResult<unknown[]>) => {
  const logger = getLogger(testConfig());
  logger.log(result);
  await logger.waitToFinishWriting();
  return logger;
};

const shippedEnvelope = () => JSON.parse(fetchMock.mock.calls[0][1].body);
const putInput = () => (send.mock.calls[0][0] as { input: Record<string, unknown> }).input;

describe('getLogger', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    logSettings = { logServiceName: 'logs', disableLogs: false, instantLogs: false };
    send.mockReset().mockResolvedValue({});
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 202 });
    vi.stubGlobal('fetch', fetchMock);
    delete process.env.AWS_LAMBDA_RUNTIME_API;
    delete process.env.storageDriveName;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  // Security regression: a story result (session, inputs, action history) must go nowhere when logging is off, when no
  // log service is configured, or from inside the logs bucket's own file-event lambda (which would otherwise log its own
  // activity back into the bucket forever).
  it.each([
    ['no log service is configured', () => (logSettings = { disableLogs: false, instantLogs: false })],
    ['logs are disabled', () => (logSettings = { logServiceName: 'logs', disableLogs: true, instantLogs: false })],
    ['running as the logs drive file-event lambda', () => (process.env.storageDriveName = QPQ_LOGS_STORAGE_DRIVE_NAME)],
  ])('ships nothing when %s', async (_name: any, arrange: any) => {
    arrange();
    process.env.AWS_LAMBDA_RUNTIME_API = '127.0.0.1:9001';

    await logAndWait(storyResult());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  // Security regression: inside a lambda the log is handed only to the loopback extension port, with the destination
  // bucket and region derived from config (never from the environment or the story), and nothing is written to S3 by
  // the handler itself.
  it('hands the log to the loopback extension with a config-derived destination inside a lambda', async () => {
    process.env.AWS_LAMBDA_RUNTIME_API = '127.0.0.1:9001';

    await logAndWait(storyResult());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:9009/log');
    expect(shippedEnvelope()).toEqual({
      bucketName: 'qpq-logs-test-app-logs-development',
      region: 'ap-southeast-2',
      key: 'corr-1.json',
      body: expect.any(String),
      storageClass: 'INTELLIGENT_TIERING',
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('writes straight to the config-derived logs bucket outside a lambda', async () => {
    await logAndWait(storyResult());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(putInput()).toEqual({
      Bucket: 'qpq-logs-test-app-logs-development',
      Key: 'corr-1.json',
      Body: expect.any(String),
      StorageClass: 'INTELLIGENT_TIERING',
    });
  });

  it('bypasses the extension when instantLogs is set', async () => {
    logSettings = { ...logSettings, instantLogs: true };
    process.env.AWS_LAMBDA_RUNTIME_API = '127.0.0.1:9001';

    await logAndWait(storyResult());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('falls back to a direct write when the extension refuses the log, so it is never dropped', async () => {
    process.env.AWS_LAMBDA_RUNTIME_API = '127.0.0.1:9001';
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await logAndWait(storyResult());

    expect(send).toHaveBeenCalledTimes(1);
    expect(putInput().Key).toBe('corr-1.json');
  });

  // Security regression: a correlation whose history logging was switched off ships only the redaction-safe entries
  // (console logs and the disable marker), never the action payloads and results recorded before shipping.
  it('strips the action history of a correlation whose logs were disabled before shipping', async () => {
    const history = [
      { act: { type: LogActionType.Create, payload: { msg: 'kept' } }, res: undefined, startedAt: '', finishedAt: '' },
      { act: { type: '@quidproquo-core/KeyValueStore/Get', payload: { key: 'secret-row' } }, res: { value: 'x' }, startedAt: '', finishedAt: '' },
      { act: { type: LogActionType.DisableEventHistory, payload: {} }, res: undefined, startedAt: '', finishedAt: '' },
    ];
    const logger = getLogger(testConfig());

    await logger.enableLogs(false, 'test', 'corr-1');
    logger.log(storyResult({ history }));
    await logger.waitToFinishWriting();

    const shipped = JSON.parse(putInput().Body as string) as StoryResult<unknown[]>;
    expect(shipped.history.map((entry) => entry.act.type)).toEqual([LogActionType.Create, LogActionType.DisableEventHistory]);
    expect(putInput().Body).not.toContain('secret-row');
  });
});
