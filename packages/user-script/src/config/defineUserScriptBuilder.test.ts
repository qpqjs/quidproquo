import { isQpqFunctionRuntimeAdvanced, QPQCoreConfigSettingType } from '@qpqjs/core';

import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { defineUserScriptBuilder } from './defineUserScriptBuilder';

describe('defineUserScriptBuilder', () => {
  it("registers an action processors source that points at this package's resolver module", async () => {
    const setting = defineUserScriptBuilder();

    expect(setting.configSettingType).toBe(QPQCoreConfigSettingType.actionProcessors);
    if (!isQpqFunctionRuntimeAdvanced(setting.runtime)) {
      throw new Error('expected an advanced runtime pointer');
    }

    const modulePath = path.resolve(setting.runtime.basePath, setting.runtime.relativePath);
    expect(fs.existsSync(`${modulePath}.ts`)).toBe(true);
    const loaded = await import(modulePath);
    expect(loaded[setting.runtime.functionName]).toBeTypeOf('function');
  });
});
