import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { defineGraphDatabase } from './graphDatabase';

describe('defineGraphDatabase', () => {
  it('builds a GraphDatabase setting with the given name and virtual network', () => {
    expect(defineGraphDatabase('Graph', 'Vpc')).toEqual({
      configSettingType: QPQCoreConfigSettingType.graphDatabase,
      uniqueKey: 'Graph',
      name: 'Graph',
      virualNetworkName: 'Vpc',
      owner: undefined,
    });
  });

  it('converts the owner to a resourceNameOverride', () => {
    expect(defineGraphDatabase('Graph', 'Vpc', { owner: { module: 'other', graphDatabaseName: 'Graph' } }).owner).toEqual({
      module: 'other',
      graphDatabaseName: 'Graph',
      resourceNameOverride: 'Graph',
    });
  });
});
