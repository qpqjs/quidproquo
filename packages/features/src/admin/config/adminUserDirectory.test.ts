import { QPQCoreConfigSettingType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { adminUserDirectoryResourceName, defineAdminUserDirectory } from './adminUserDirectory';

describe('defineAdminUserDirectory', () => {
  it('defines a single admin user directory', () => {
    const config = defineAdminUserDirectory({ owner: { module: 'log' } });

    expect(config).toHaveLength(1);
    expect(config[0]).toMatchObject({
      configSettingType: QPQCoreConfigSettingType.userDirectory,
      name: adminUserDirectoryResourceName,
    });
  });
});
