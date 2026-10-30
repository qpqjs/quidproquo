import { QPQCoreConfigSettingType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { ADMIN_USER_DIRECTORY_NAME } from '../constants';
import { defineAdminUserDirectory } from './adminUserDirectory';

describe('defineAdminUserDirectory', () => {
  it('defines a single admin user directory', () => {
    const config = defineAdminUserDirectory({ owner: { module: 'log' } });

    expect(config).toHaveLength(1);
    expect(config[0]).toMatchObject({
      configSettingType: QPQCoreConfigSettingType.userDirectory,
      name: ADMIN_USER_DIRECTORY_NAME,
    });
  });
});
