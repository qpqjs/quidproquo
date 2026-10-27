import { buildTestQpqConfig, ErrorActionType, ErrorTypeEnum, resolveActionResultError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getErrorThrowErrorActionProcessor } from './getErrorThrowErrorActionProcessor';

describe('getErrorThrowErrorActionProcessor', () => {
  it('turns the payload into an errored action result', async () => {
    const processor = (await getErrorThrowErrorActionProcessor(buildTestQpqConfig(), async () => null))[ErrorActionType.ThrowError] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = await processor({ errorType: ErrorTypeEnum.NotFound, errorText: 'missing thing', errorStack: 'stack-trace' }, undefined as any);

    expect(resolveActionResultError(result)).toEqual({
      errorType: ErrorTypeEnum.NotFound,
      errorText: 'missing thing',
      errorStack: 'stack-trace',
    });
  });
});
