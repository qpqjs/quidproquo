import { describe, expect, it, vi } from 'vitest';

import { actionResult } from '../logic/actionLogic';
import { buildTestQpqConfig } from '../testing/configTesting';
import {
  buildActionProcessorResolver,
  buildTestStorySession,
  createStubLogger,
  getTestTimeNow,
  noopDynamicModuleLoader,
} from '../testing/runtimeTesting';
import { AskResponse, QpqRuntimeType } from '../types/StorySession';
import { resolveStoryWithLogs } from './resolveStoryWithLogs';

describe('resolveStoryWithLogs', () => {
  it('captures console.log into storyResult.logs, calls logger.log, and restores console.log', async () => {
    const logSpy = vi.fn();
    const logger = createStubLogger(logSpy);

    // Swap in a silent console.log so the captured output does not print, and so we can
    // assert resolveStoryWithLogs restores exactly this reference in its finally block.
    const silentConsoleLog = () => {};
    const originalConsoleLog = console.log;
    console.log = silentConsoleLog;

    function* story(): AskResponse<string> {
      yield { type: 'Speak' };
      return 'done';
    }

    const processors = buildActionProcessorResolver({
      Speak: async () => {
        console.log('hello from processor');
        return actionResult('spoke');
      },
    });

    let result;
    try {
      result = await resolveStoryWithLogs(
        story,
        [],
        buildTestQpqConfig(),
        buildTestStorySession(),
        processors,
        getTestTimeNow,
        logger,
        'corr-logs',
        QpqRuntimeType.UNIT_TEST,
        noopDynamicModuleLoader as any,
      );
    } finally {
      const restored = console.log;
      console.log = originalConsoleLog;
      expect(restored).toBe(silentConsoleLog);
    }

    expect(result.logs?.some((entry) => entry.a.includes('hello from processor'))).toBe(true);
    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith(result);
  });

  it('restores the original console.log after overlapping stories (no leaked wrappers)', async () => {
    const logger = createStubLogger(vi.fn());

    const silentConsoleLog = () => {};
    const originalConsoleLog = console.log;
    console.log = silentConsoleLog;

    // A processor that parks until released, so two stories can overlap
    // out of order: A starts, B starts, A finishes, B finishes — the
    // interleaving that used to leak A's wrapper into console.log forever.
    const makeParkedStory = () => {
      let release!: () => void;
      const parked = new Promise<void>((resolve) => {
        release = resolve;
      });

      function* story(): AskResponse<string> {
        yield { type: 'Park' };
        console.log('parked story spoke');
        return 'done';
      }

      const processors = buildActionProcessorResolver({
        Park: async () => {
          await parked;
          return actionResult('released');
        },
      });

      const run = () =>
        resolveStoryWithLogs(
          story,
          [],
          buildTestQpqConfig(),
          buildTestStorySession(),
          processors,
          getTestTimeNow,
          logger,
          'corr-overlap',
          QpqRuntimeType.UNIT_TEST,
          noopDynamicModuleLoader as any,
        );

      return { run, release };
    };

    try {
      const a = makeParkedStory();
      const b = makeParkedStory();

      const aPromise = a.run();
      const bPromise = b.run();

      a.release();
      const aResult = await aPromise;

      b.release();
      const bResult = await bPromise;

      expect(console.log).toBe(silentConsoleLog);

      // Both stories captured their own logs even while overlapping.
      expect(aResult.logs?.some((entry) => entry.a.includes('parked story spoke'))).toBe(true);
      expect(bResult.logs?.some((entry) => entry.a.includes('parked story spoke'))).toBe(true);
    } finally {
      console.log = originalConsoleLog;
    }
  });
});
