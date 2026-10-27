import { ActionProcessorsQPQConfigSetting, QPQCoreConfigSettingType, QpqFunctionRuntimeAdvanced } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { defineConsoleLogRedaction } from './defineConsoleLogRedaction';

describe('defineConsoleLogRedaction', () => {
  it('registers the redacted log processors entry as an action processor source', () => {
    const [setting] = defineConsoleLogRedaction() as ActionProcessorsQPQConfigSetting[];

    expect(setting.configSettingType).toBe(QPQCoreConfigSettingType.actionProcessors);
    expect(setting.runtime as QpqFunctionRuntimeAdvanced).toMatchObject({
      relativePath: 'consoleLogRedaction/entry/actionProcessor/getConsoleLogRedactionActionProcessors',
      functionName: 'getConsoleLogRedactionActionProcessors',
    });
  });
});
