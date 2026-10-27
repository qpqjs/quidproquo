import { buildTestQpqConfig, LogActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getLogTemplateLiteralActionProcessor } from './getLogTemplateLiteralActionProcessor';

describe('getLogTemplateLiteralActionProcessor', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('interpolates the template values between the string parts and logs the message', async () => {
    const processors = await getLogTemplateLiteralActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[LogActionType.TemplateLiteral];

    const result = await invokeProcessor(process, { messageParts: [['a ', ' b'], ['X']] });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const message = logSpy.mock.calls[0][0] as string;
    expect(message).toContain('a ');
    expect(message).toContain('X');
    expect(message).toContain(' b');
    expect(resolveActionResult(result)).toBeUndefined();
  });
});
