// @vitest-environment jsdom
import { buildTestQpqConfig, ConfigActionType, noopDynamicModuleLoader } from '@qpqjs/core';
import { QueryParamsActionType, WindowActionType } from '@qpqjs/web';
import { ApiActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getWebActionProcessors } from './getWebActionProcessors';

describe('getWebActionProcessors', () => {
  it('assembles a populated map including the web-specific processors', async () => {
    const processors = await getWebActionProcessors(buildTestQpqConfig(), noopDynamicModuleLoader);

    expect(Object.keys(processors).length).toBeGreaterThan(0);
    for (const actionType of [
      ApiActionType.Request,
      QueryParamsActionType.Get,
      QueryParamsActionType.GetAll,
      QueryParamsActionType.Set,
      WindowActionType.GetLocation,
      ConfigActionType.GetParameter,
    ]) {
      expect(typeof processors[actionType]).toBe('function');
    }
  });
});
