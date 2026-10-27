import { qpqCoreUtils } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineServiceFunction } from './serviceFunction';

const runtime = '/src/functions/charge::charge';

describe('defineServiceFunction', () => {
  it('defaults the function name to the story name derived from the runtime', () => {
    const setting = defineServiceFunction(runtime);

    expect(setting.configSettingType).toBe(QPQWebServerConfigSettingType.ServiceFunction);
    expect(setting.functionName).toBe(qpqCoreUtils.getStoryNameFromQpqFunctionRuntime(runtime));
    expect(setting.uniqueKey).toBe(setting.functionName);
    expect(setting.runtime).toBe(runtime);
    expect(setting.owner).toBeUndefined();
  });

  it('uses the supplied function name and virtual network', () => {
    const setting = defineServiceFunction(runtime, { functionName: 'chargeCard', virtualNetworkName: 'vnet' });

    expect(setting.functionName).toBe('chargeCard');
    expect(setting.uniqueKey).toBe('chargeCard');
    expect(setting.virtualNetworkName).toBe('vnet');
  });

  it('derives the owner override from the cross-module owner', () => {
    const setting = defineServiceFunction(runtime, { owner: { module: 'billing', functionName: 'shared' } });

    expect(setting.owner).toEqual({ module: 'billing', functionName: 'shared', resourceNameOverride: 'shared' });
  });
});
