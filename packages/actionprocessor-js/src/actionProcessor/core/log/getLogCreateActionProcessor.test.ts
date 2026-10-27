import { buildTestQpqConfig, LogActionType, LogLevelEnum, resolveActionResult } from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLogCreateActionProcessor } from './getLogCreateActionProcessor';

describe('getLogCreateActionProcessor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const resolve = async () =>
    (await getLogCreateActionProcessor(buildTestQpqConfig(), async () => null))[LogActionType.Create] as (p: any, ...rest: any[]) => Promise<any>;

  it('logs the level and message and succeeds', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = await resolve();

    const result = await processor({ msg: 'hello', logLevel: LogLevelEnum.Info }, undefined as any);

    expect(log).toHaveBeenCalledWith(`${LogLevelEnum.Info}: hello`);
    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('appends the data argument when provided', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = await resolve();
    const data = { userId: '1' };

    await processor({ msg: 'hello', logLevel: LogLevelEnum.Error, data }, undefined as any);

    expect(log).toHaveBeenCalledWith(`${LogLevelEnum.Error}: hello`, data);
  });

  it('appends falsy-but-present data values like 0 and false', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = await resolve();

    await processor({ msg: 'count', logLevel: LogLevelEnum.Info, data: 0 }, undefined as any);
    await processor({ msg: 'flag', logLevel: LogLevelEnum.Info, data: false }, undefined as any);

    expect(log).toHaveBeenNthCalledWith(1, `${LogLevelEnum.Info}: count`, 0);
    expect(log).toHaveBeenNthCalledWith(2, `${LogLevelEnum.Info}: flag`, false);
  });
});
