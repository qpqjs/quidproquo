import { describe, expect, it, vi } from 'vitest';

import { actionResult } from '../logic/actionLogic';
import {
  buildActionProcessorList,
  buildActionProcessorResolver,
  buildTestStorySession,
  createStubLogger,
  getTestTimeNow,
  noopDynamicModuleLoader,
  TEST_TIME_NOW,
  testRandomGuid,
} from './runtimeTesting';

describe('getTestTimeNow', () => {
  it('returns the fixed ISO timestamp', () => {
    expect(getTestTimeNow()).toBe(TEST_TIME_NOW);
  });
});

describe('testRandomGuid', () => {
  it('returns a deterministic guid', () => {
    expect(testRandomGuid()).toBe('guid-0');
  });
});

describe('noopDynamicModuleLoader', () => {
  it('resolves to null', async () => {
    expect(await noopDynamicModuleLoader()).toBe(null);
  });
});

describe('buildTestStorySession', () => {
  it('returns a base session at depth 0', () => {
    expect(buildTestStorySession()).toEqual({ correlation: 'corr-0', depth: 0, context: {} });
  });

  it('applies overrides', () => {
    expect(buildTestStorySession({ depth: 5 }).depth).toBe(5);
  });
});

describe('createStubLogger', () => {
  it('exposes async no-op lifecycle hooks', async () => {
    const logger = createStubLogger();

    await expect(logger.enableLogs(true, 'reason', 'corr')).resolves.toBeUndefined();
    await expect(logger.waitToFinishWriting()).resolves.toBeUndefined();
    await expect(logger.moveToPermanentStorage()).resolves.toBeUndefined();
  });

  it('uses the injected log function', () => {
    const log = vi.fn();
    const logger = createStubLogger(log);

    logger.log({ correlation: 'c' } as any);

    expect(log).toHaveBeenCalledOnce();
  });
});

describe('buildActionProcessorList', () => {
  it('returns the processor map', () => {
    const processor = async () => actionResult('x');
    const list = buildActionProcessorList({ Thing: processor });

    expect(list.Thing).toBe(processor);
  });
});

describe('buildActionProcessorResolver', () => {
  it('resolves to the processor list', async () => {
    const processor = async () => actionResult('x');
    const resolver = buildActionProcessorResolver({ Thing: processor });

    const list = await resolver({} as any, noopDynamicModuleLoader as any);

    expect(list.Thing).toBe(processor);
  });
});
