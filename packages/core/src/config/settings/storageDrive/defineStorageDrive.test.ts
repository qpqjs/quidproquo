import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { defineStorageDrive } from './defineStorageDrive';

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
      cryptoKeyName: undefined,
      scoped: false,
      lockedDown: false,
      deleteOnRemove: undefined,
      owner: undefined,
    });
  });

  it('carries scoped through and rejects it alongside copyPath', () => {
    expect(defineStorageDrive('Uploads', { scoped: true }).scoped).toBe(true);
    expect(() => defineStorageDrive('Uploads', { scoped: true, copyPath: './static' })).toThrow(/scoped/);
  });

  it('defaults global and lockedDown to false and cryptoKeyName to undefined', () => {
    const setting = defineStorageDrive('Uploads');

    expect(setting.global).toBe(false);
    expect(setting.cryptoKeyName).toBeUndefined();
    expect(setting.lockedDown).toBe(false);
  });

  // Unset is its own answer (the deployment decides), so it must not be turned into true or false here.
  it('leaves deleteOnRemove unset unless given, and carries either answer through', () => {
    expect(defineStorageDrive('Uploads').deleteOnRemove).toBeUndefined();
    expect(defineStorageDrive('Uploads', { deleteOnRemove: true }).deleteOnRemove).toBe(true);
    expect(defineStorageDrive('Uploads', { deleteOnRemove: false }).deleteOnRemove).toBe(false);
  });

  it('applies the supplied options', () => {
    const setting = defineStorageDrive('Uploads', { global: true, cryptoKeyName: 'main', lockedDown: true, copyPath: './assets' });

    expect(setting.global).toBe(true);
    expect(setting.cryptoKeyName).toBe('main');
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
