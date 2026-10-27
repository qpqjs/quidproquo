import { buildTestQpqConfig, buildTestStorySession, LogActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getLogDisableEventHistoryActionProcessor } from './getLogDisableEventHistoryActionProcessor';

describe('getLogDisableEventHistoryActionProcessor', () => {
  it('forwards enable, reason and the session correlation to the logger', async () => {
    const processors = await getLogDisableEventHistoryActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[LogActionType.DisableEventHistory];
    const logger = { enableLogs: vi.fn() } as any;

    const result = await process(
      { enable: false, reason: 'too noisy' },
      buildTestStorySession({ correlation: 'corr-7' }),
      {},
      logger,
      () => {},
      async () => null,
      undefined as any,
    );

    expect(logger.enableLogs).toHaveBeenCalledWith(false, 'too noisy', 'corr-7');
    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('passes an empty correlation when the session has none', async () => {
    const processors = await getLogDisableEventHistoryActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[LogActionType.DisableEventHistory];
    const logger = { enableLogs: vi.fn() } as any;

    await process(
      { enable: true, reason: 'verbose' },
      buildTestStorySession({ correlation: '' }),
      {},
      logger,
      () => {},
      async () => null,
      undefined as any,
    );

    expect(logger.enableLogs).toHaveBeenCalledWith(true, 'verbose', '');
  });
});
