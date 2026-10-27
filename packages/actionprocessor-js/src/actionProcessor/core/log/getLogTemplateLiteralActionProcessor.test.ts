import { buildTestQpqConfig, LogActionType, resolveActionResult } from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLogTemplateLiteralActionProcessor } from './getLogTemplateLiteralActionProcessor';

describe('getLogTemplateLiteralActionProcessor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('joins the decomposed message parts and logs the result', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processor = (await getLogTemplateLiteralActionProcessor(buildTestQpqConfig(), async () => null))[LogActionType.TemplateLiteral] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = await processor(
      {
        messageParts: [
          ['user ', ' did ', ' times'],
          ['bob', 3],
        ],
      },
      undefined as any,
    );

    expect(log).toHaveBeenCalledWith('user bob did 3 times');
    expect(resolveActionResult(result)).toBeUndefined();
  });
});
