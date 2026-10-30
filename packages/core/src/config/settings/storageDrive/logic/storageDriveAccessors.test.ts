import { describe, expect, it } from 'vitest';

import { defineApplication } from '../../applicationName';
import { defineModule } from '../../moduleName';
import { defineStorageDrive } from '../defineStorageDrive';
import { getAllStorageDriveConfigs } from './getAllStorageDriveConfigs';
import { getOwnedStorageDriveConfigs } from './getOwnedStorageDriveConfigs';
import { getStorageDriveByName } from './getStorageDriveByName';
import { resolveStorageDriveOrThrow } from './resolveStorageDriveOrThrow';

const config = [
  defineApplication('app', 'production', 'root'),
  defineModule('svc'),
  defineStorageDrive('mine'),
  defineStorageDrive('theirs', { owner: { module: 'other', storageDriveName: 'theirs' } }),
];

describe('storage drive accessors', () => {
  it('lists every drive, and only the owned ones', () => {
    expect(getAllStorageDriveConfigs(config).map((drive) => drive.storageDrive)).toEqual(['mine', 'theirs']);
    expect(getOwnedStorageDriveConfigs(config).map((drive) => drive.storageDrive)).toEqual(['mine']);
  });

  it('finds a drive by name, null when unknown', () => {
    expect(getStorageDriveByName('mine', config)?.storageDrive).toBe('mine');
    expect(getStorageDriveByName('missing', config)).toBeNull();
  });

  it('resolves a drive by name or throws naming it', () => {
    expect(resolveStorageDriveOrThrow('theirs', config).storageDrive).toBe('theirs');
    expect(() => resolveStorageDriveOrThrow('missing', config)).toThrow('Could not find storage drive config for [missing]');
  });
});
