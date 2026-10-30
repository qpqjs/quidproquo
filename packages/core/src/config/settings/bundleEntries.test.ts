import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineBundleEntries } from './bundleEntries';

describe('defineBundleEntries', () => {
  it('keeps the runtimes and keys the setting by them', () => {
    const setting = defineBundleEntries(['/src/a::run', '/src/b::check']);

    expect(setting.configSettingType).toBe(QPQCoreConfigSettingType.bundleEntries);
    expect(setting.runtimes).toEqual(['/src/a::run', '/src/b::check']);
    expect(setting.uniqueKey).toContain('/src/a::run');
    expect(setting.uniqueKey).toContain('/src/b::check');
  });
});
