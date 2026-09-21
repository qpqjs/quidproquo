import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineStorageDrive } from './storageDrive';

describe('defineStorageDrive', () => {
  it('builds a StorageDrive setting with the given name and defaults', () => {
    expect(defineStorageDrive('Uploads')).toEqual({
      configSettingType: QPQCoreConfigSettingType.storageDrive,
      uniqueKey: 'Uploads',
      storageDrive: 'Uploads',
      copyPath: undefined,
      global: false,
      onEvent: undefined,
      lifecycleRules: undefined,
      encryption: false,
      scoped: false,
      lockedDown: false,
      owner: undefined,
    });
  });

  it('carries scoped through and rejects it alongside copyPath', () => {
    expect(defineStorageDrive('Uploads', { scoped: true }).scoped).toBe(true);
    expect(() => defineStorageDrive('Uploads', { scoped: true, copyPath: './static' })).toThrow(/scoped/);
  });

  it('defaults global, encryption and lockedDown to false', () => {
    const setting = defineStorageDrive('Uploads');

    expect(setting.global).toBe(false);
    expect(setting.encryption).toBe(false);
    expect(setting.lockedDown).toBe(false);
  });

  it('applies the supplied options', () => {
    const setting = defineStorageDrive('Uploads', { global: true, encryption: true, lockedDown: true, copyPath: './assets' });

    expect(setting.global).toBe(true);
    expect(setting.encryption).toBe(true);
    expect(setting.lockedDown).toBe(true);
    expect(setting.copyPath).toBe('./assets');
  });

  it('passes lifecycle rules and event handlers through', () => {
    const lifecycleRules = [{ deleteAfterDays: 30 }];
    const onEvent = { create: '/entry/files::onCreate' as const };

    const setting = defineStorageDrive('Uploads', { lifecycleRules, onEvent });

    expect(setting.lifecycleRules).toEqual(lifecycleRules);
    expect(setting.onEvent).toEqual(onEvent);
  });

  it('converts the owner to a resourceNameOverride', () => {
    expect(defineStorageDrive('Uploads', { owner: { module: 'other', storageDriveName: 'Uploads' } }).owner).toEqual({
      module: 'other',
      storageDriveName: 'Uploads',
      resourceNameOverride: 'Uploads',
    });
  });
});
