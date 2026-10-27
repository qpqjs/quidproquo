import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineJavascriptRuntime, JavascriptRuntimeArchitecture, JavascriptRuntimeVersion } from './javascriptRuntime';

describe('defineJavascriptRuntime', () => {
  it('defaults to node22 on arm64', () => {
    expect(defineJavascriptRuntime()).toEqual({
      configSettingType: QPQCoreConfigSettingType.javascriptRuntime,
      uniqueKey: 'JavascriptRuntime',
      runtimeVersion: JavascriptRuntimeVersion.Node22,
      architecture: JavascriptRuntimeArchitecture.Arm64,
    });
  });

  it('uses the supplied runtime version and architecture', () => {
    const setting = defineJavascriptRuntime({
      runtimeVersion: JavascriptRuntimeVersion.Node24,
      architecture: JavascriptRuntimeArchitecture.X86_64,
    });

    expect(setting.runtimeVersion).toBe(JavascriptRuntimeVersion.Node24);
    expect(setting.architecture).toBe(JavascriptRuntimeArchitecture.X86_64);
  });
});
