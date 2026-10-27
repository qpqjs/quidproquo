import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineVirtualNetwork } from './virtualNetwork';

describe('defineVirtualNetwork', () => {
  it('builds a VirtualNetwork setting with the given name', () => {
    expect(defineVirtualNetwork('Vpc')).toEqual({
      configSettingType: QPQCoreConfigSettingType.virtualNetwork,
      uniqueKey: 'Vpc',
      name: 'Vpc',
    });
  });
});
