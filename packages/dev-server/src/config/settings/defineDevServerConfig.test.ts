import { QPQWebServerConfigSettingType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { defineDevServerConfig } from './defineDevServerConfig';

describe('defineDevServerConfig', () => {
  it('returns only the safe configs by default, which is empty with no vpcs', () => {
    expect(defineDevServerConfig()).toEqual([]);
  });

  it('adds a service function per vpc named graphQuery<vpc>', () => {
    const config = defineDevServerConfig({ vpcList: ['Alpha', 'Beta'] });

    expect(config).toHaveLength(2);
    expect(config.map((c: any) => c.functionName)).toEqual(['graphQueryAlpha', 'graphQueryBeta']);
    expect(config.map((c: any) => c.virtualNetworkName)).toEqual(['Alpha', 'Beta']);
    config.forEach((c: any) => {
      expect(c.configSettingType).toBe(QPQWebServerConfigSettingType.ServiceFunction);
    });
  });

  it('still only adds the safe configs when onlyDeploySafe is false', () => {
    const config = defineDevServerConfig({ onlyDeploySafe: false, vpcList: ['Alpha'] });

    expect(config).toHaveLength(1);
    expect((config[0] as any).functionName).toBe('graphQueryAlpha');
  });
});
