import { buildTestQpqConfig, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';
import { ApiKeyValidationActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getApiKeyValidationValidateActionProcessor } from './getApiKeyValidationValidateActionProcessor';

describe('getApiKeyValidationValidateActionProcessor', () => {
  it('always validates true in permissive dev mode', async () => {
    const processors = await getApiKeyValidationValidateActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[ApiKeyValidationActionType.Validate];

    const result = await invokeProcessor(process, {} as any);

    expect(resolveActionResult(result)).toBe(true);
  });
});
