import { QPQCoreConfigSettingType, QueueQPQConfigSetting } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { defineSeed } from './seed';

describe('defineSeed', () => {
  it('emits a global, a deploy event and a queue', () => {
    const config = defineSeed(['/src/seed/users::run']);
    const types = config.map((setting) => (setting as { configSettingType: string }).configSettingType);

    expect(types).toEqual([QPQCoreConfigSettingType.global, QPQCoreConfigSettingType.deployEvent, QPQCoreConfigSettingType.queue]);
  });

  it('gives a seed one try, so one that failed part way is never run again by itself', () => {
    const queue = defineSeed(['/src/seed/users::run']).find(
      (setting) => (setting as QueueQPQConfigSetting).configSettingType === QPQCoreConfigSettingType.queue,
    ) as QueueQPQConfigSetting;

    expect(queue.maxTries).toBe(1);
  });
});
