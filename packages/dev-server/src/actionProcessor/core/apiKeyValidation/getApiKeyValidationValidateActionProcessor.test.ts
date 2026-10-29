import { resolveActionResult } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';
import { ApiKeyValidationActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getApiKeyValidationValidateActionProcessor } from './getApiKeyValidationValidateActionProcessor';

describe('getApiKeyValidationValidateActionProcessor', () => {
  it('always validates true in permissive dev mode', async () => {
    const processors = await getApiKeyValidationValidateActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const process = processors[ApiKeyValidationActionType.Validate];

    const result = await invokeProcessor(process, {} as any);

    expect(resolveActionResult(result)).toBe(true);
  });
});
