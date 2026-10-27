import { QPQCoreConfigSettingType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineSeed } from './seed';

describe('defineSeed', () => {
  it('emits a global, a deploy event and a queue', () => {
    const config = defineSeed(['/src/seed/users::run']);
    const types = config.map((setting) => (setting as { configSettingType: string }).configSettingType);

    expect(types).toEqual([QPQCoreConfigSettingType.global, QPQCoreConfigSettingType.deployEvent, QPQCoreConfigSettingType.queue]);
  });
});
