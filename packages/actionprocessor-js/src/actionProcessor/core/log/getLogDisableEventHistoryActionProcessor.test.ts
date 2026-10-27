import { buildTestQpqConfig, buildTestStorySession, createStubLogger, LogActionType, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getLogDisableEventHistoryActionProcessor } from './getLogDisableEventHistoryActionProcessor';

describe('getLogDisableEventHistoryActionProcessor', () => {
  it('forwards the enable flag, reason and correlation to the logger', async () => {
    const enableLogs = vi.fn(async () => {});
    const logger = { ...createStubLogger(), enableLogs };
    const processor = (await getLogDisableEventHistoryActionProcessor(buildTestQpqConfig(), async () => null))[LogActionType.DisableEventHistory] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = await processor({ enable: false, reason: 'pii' }, buildTestStorySession({ correlation: 'corr-7' }), {}, logger);

    expect(enableLogs).toHaveBeenCalledWith(false, 'pii', 'corr-7');
    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('defaults the correlation to an empty string when the session has none', async () => {
    const enableLogs = vi.fn(async () => {});
    const logger = { ...createStubLogger(), enableLogs };
    const processor = (await getLogDisableEventHistoryActionProcessor(buildTestQpqConfig(), async () => null))[LogActionType.DisableEventHistory] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    await processor({ enable: true, reason: 'done' }, buildTestStorySession({ correlation: undefined }), {}, logger);

    expect(enableLogs).toHaveBeenCalledWith(true, 'done', '');
  });
});
