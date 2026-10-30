import { defineUserDirectory, QPQConfig, QPQConfigAdvancedUserDirectorySettings } from '@qpqjs/core';

import { ADMIN_USER_DIRECTORY_NAME } from '../constants';

type QPQConfigAdvancedAdminUserDirectorySettings = Required<Pick<QPQConfigAdvancedUserDirectorySettings, 'owner'>>;

export const defineAdminUserDirectory = (options?: QPQConfigAdvancedAdminUserDirectorySettings): QPQConfig => {
  const configs = [defineUserDirectory(ADMIN_USER_DIRECTORY_NAME, options)];

  return configs;
};
