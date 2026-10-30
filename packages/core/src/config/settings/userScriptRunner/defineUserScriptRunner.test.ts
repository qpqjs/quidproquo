import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { defineUserScriptRunner } from './defineUserScriptRunner';

describe('defineUserScriptRunner', () => {
  it('builds one UserScriptRunner setting per service with the defaults', () => {
    expect(defineUserScriptRunner()).toEqual({
      configSettingType: QPQCoreConfigSettingType.userScriptRunner,
      uniqueKey: 'UserScriptRunner',
      timeoutInSeconds: 60,
      memoryInMiB: 512,
      maxConcurrentExecutions: undefined,
      virtualNetworkName: undefined,
    });
  });

  it('keeps the given limits and network', () => {
    const setting = defineUserScriptRunner({ timeoutInSeconds: 120, memoryInMiB: 1024, maxConcurrentExecutions: 5, virtualNetworkName: 'sealed' });

    expect(setting).toMatchObject({ timeoutInSeconds: 120, memoryInMiB: 1024, maxConcurrentExecutions: 5, virtualNetworkName: 'sealed' });
  });

  // Security regression: the sandbox's time and memory are config, so a typo must fail at define time rather than deploy
  // an unbounded runner. The platform's ceilings (lambda's 15 minutes, 10240 MiB) are checked at synth by deploy-aws.
  it.each([0, -5, 1.5, Number.NaN])('refuses a timeout of %s seconds', (timeoutInSeconds: any) => {
    expect(() => defineUserScriptRunner({ timeoutInSeconds })).toThrow('timeoutInSeconds');
  });

  it.each([0, 512.5])('refuses a memory of %s MiB', (memoryInMiB: any) => {
    expect(() => defineUserScriptRunner({ memoryInMiB })).toThrow('memoryInMiB');
  });
});
