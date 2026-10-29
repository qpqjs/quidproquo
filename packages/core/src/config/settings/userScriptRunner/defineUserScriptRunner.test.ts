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

  it.each([0, 901, 1.5])('refuses timeoutInSeconds [%s]', (timeoutInSeconds) => {
    expect(() => defineUserScriptRunner({ timeoutInSeconds })).toThrow('timeoutInSeconds');
  });

  it.each([64, 10241, 512.5])('refuses memoryInMiB [%s]', (memoryInMiB) => {
    expect(() => defineUserScriptRunner({ memoryInMiB })).toThrow('memoryInMiB');
  });

  // Security regression: the sandbox's time and memory ceilings are config, so a typo must fail at define time rather
  // than deploy an unbounded runner.
  it.each([0, 901, 1.5, Number.NaN])('refuses a timeout of %s seconds', (timeoutInSeconds) => {
    expect(() => defineUserScriptRunner({ timeoutInSeconds })).toThrow('timeoutInSeconds');
  });

  it.each([127, 10241, 512.5])('refuses a memory of %s MiB', (memoryInMiB) => {
    expect(() => defineUserScriptRunner({ memoryInMiB })).toThrow('memoryInMiB');
  });
});
