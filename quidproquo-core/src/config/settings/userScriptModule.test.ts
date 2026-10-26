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
      typesRuntime: undefined,
    });
  });

  it('turns `types` into a runtime the bundler answers with the declarations', () => {
    const setting = defineUserScriptModule('my-sdk/v1', '/entry/scriptModules::mySdkV1', { types: '/../sdk/src/v1/index.ts' });

    expect(setting.typesRuntime).toBe('/../sdk/src/v1/index.ts?qpq-user-script-module-types::declarations');
  });

  it.each(['relative/a.ts', '/a.ts?x', '/a.ts::b'])('refuses [%s] as a types path', (types) => {
    expect(() => defineUserScriptModule('my-sdk/v1', '/x::y', { types: types as `/${string}` })).toThrow('plain file path');
  });

  it('refuses to shadow a shared framework package', () => {
    expect(() => defineUserScriptModule('quidproquo-core', '/x::y')).toThrow('shared framework package');
  });

  it.each(['', './local', '/abs', 'node:fs'])('refuses [%s] as an import name', (name) => {
    expect(() => defineUserScriptModule(name, '/x::y')).toThrow('package-style');
  });
});
