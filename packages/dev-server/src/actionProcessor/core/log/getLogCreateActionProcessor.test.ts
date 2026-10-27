import { buildTestQpqConfig, LogActionType, LogLevelEnum, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getLogCreateActionProcessor } from './getLogCreateActionProcessor';

describe('getLogCreateActionProcessor', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  const getProcess = async () => {
    const processors = await getLogCreateActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    return processors[LogActionType.Create];
  };

  it('logs the colorized level and message with data when data is present', async () => {
    const process = await getProcess();
    const data = { user: 'jane' };

    const result = await invokeProcessor(process, { msg: 'hello', logLevel: LogLevelEnum.Info, data });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain(`${LogLevelEnum[LogLevelEnum.Info]}: hello`);
    expect(logSpy.mock.calls[0][1]).toEqual(data);
    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('logs only the message when data is absent', async () => {
    const process = await getProcess();

    const result = await invokeProcessor(process, { msg: 'oops', logLevel: LogLevelEnum.Error });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0]).toHaveLength(1);
    expect(logSpy.mock.calls[0][0]).toContain(`${LogLevelEnum[LogLevelEnum.Error]}: oops`);
    expect(resolveActionResult(result)).toBeUndefined();
  });
});
