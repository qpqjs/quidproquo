import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineDeployEvent } from './deployEvent';

describe('defineDeployEvent', () => {
  it('builds a DeployEvent setting with the given name and runtime', () => {
    expect(defineDeployEvent('onDeploy', '/entry/deploy::run')).toEqual({
      configSettingType: QPQCoreConfigSettingType.deployEvent,
      uniqueKey: 'onDeploy',
      name: 'onDeploy',
      runtime: '/entry/deploy::run',
    });
  });
});
