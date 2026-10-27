import {
  actionResult,
  buildTestQpqConfig,
  buildTestStorySession,
  ConfigActionType,
  EventActionType,
  noopDynamicModuleLoader,
  QpqRuntimeType,
} from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ResolvedDevServerConfig } from '../types';
import { processEvent } from './processEvent';

const waitToFinishWriting = vi.fn(async () => {});

vi.mock('../actionProcessor', () => ({
  getDevServerActionProcessors: async () => ({}),
  getExpressApiEventEventProcessor: async () => ({}),
}));

vi.mock('quidproquo-actionprocessor-js', () => ({
  getCustomActionActionProcessor: async () => ({}),
}));

vi.mock('../implementations/logger', () => ({
  getDevServerLogger: () => ({
    enableLogs: async () => {},
    log: () => {},
    waitToFinishWriting,
    moveToPermanentStorage: async () => {},
  }),
}));

const devServerConfig = {
  serverDomain: 'localhost',
  serverPort: 0,
  runtimePath: '/tmp/qpq',
  dynamicModuleLoader: noopDynamicModuleLoader,
  qpqConfigs: [],
  fileStorageConfig: {} as any,
} as unknown as ResolvedDevServerConfig;

describe('processEvent', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('runs the process-event story and returns a StoryResult, awaiting the logger', async () => {
    const transformed = { statusCode: 200, body: 'ok' };

    const getActionProcessors = async () => ({
      [ConfigActionType.GetGlobal]: async () => actionResult('1.0.0'),
      [EventActionType.GetRecords]: async () => actionResult([]),
      [EventActionType.TransformResponseResult]: async () => actionResult(transformed),
    });

    const result = await processEvent(
      { path: '/' },
      buildTestQpqConfig(),
      noopDynamicModuleLoader,
      getActionProcessors as any,
      QpqRuntimeType.API,
      () => buildTestStorySession(),
      devServerConfig,
    );

    expect(typeof result.correlation).toBe('string');
    expect(result.result).toEqual(transformed);
    expect(result.error).toBeUndefined();
    expect(waitToFinishWriting).toHaveBeenCalledTimes(1);
  });
});
