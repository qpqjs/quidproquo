import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineDynamicFunctions } from './dynamicFunctions';

describe('defineDynamicFunctions', () => {
  it('builds a DynamicFunctions setting keyed by the given name', () => {
    expect(defineDynamicFunctions('templateEventDoc', '/entry/eventDocs::templateEventDoc')).toEqual({
      configSettingType: QPQCoreConfigSettingType.dynamicFunctions,
      uniqueKey: 'templateEventDoc',
      runtime: '/entry/eventDocs::templateEventDoc',
      dynamicFunctionsName: 'templateEventDoc',
      owner: undefined,
    });
  });

  it('converts an owner to the generic resource name override', () => {
    const setting = defineDynamicFunctions('templateEventDoc', '/entry/eventDocs::templateEventDoc', {
      owner: { module: 'template', dynamicFunctionsName: 'otherName' },
    });

    expect(setting.owner).toEqual({
      module: 'template',
      dynamicFunctionsName: 'otherName',
      resourceNameOverride: 'otherName',
    });
  });
});
