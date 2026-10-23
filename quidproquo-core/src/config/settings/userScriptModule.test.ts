import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineUserScriptModule } from './userScriptModule';

describe('defineUserScriptModule', () => {
  it('builds a UserScriptModule setting keyed by the import name', () => {
    expect(defineUserScriptModule('my-sdk/v1', '/entry/scriptModules::mySdkV1')).toEqual({
      configSettingType: QPQCoreConfigSettingType.userScriptModule,
      uniqueKey: 'my-sdk/v1',
      moduleName: 'my-sdk/v1',
      runtime: '/entry/scriptModules::mySdkV1',
    });
  });

  it('refuses to shadow a shared framework package', () => {
    expect(() => defineUserScriptModule('quidproquo-core', '/x::y')).toThrow('shared framework package');
  });

  it.each(['', './local', '/abs', 'node:fs'])('refuses [%s] as an import name', (name) => {
    expect(() => defineUserScriptModule(name, '/x::y')).toThrow('package-style');
  });
});
