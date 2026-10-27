import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineModule } from './moduleName';

describe('defineModule', () => {
  it('builds a Module setting with the given name', () => {
    expect(defineModule('MyModule')).toEqual({
      configSettingType: QPQCoreConfigSettingType.moduleName,
      uniqueKey: 'MyModule',
      moduleName: 'MyModule',
    });
  });
});
