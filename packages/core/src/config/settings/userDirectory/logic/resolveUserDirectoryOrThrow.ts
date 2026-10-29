import { QPQConfig } from '../../../QPQConfig';
import { UserDirectoryQPQConfigSetting } from '../types';
import { getUserDirectoryByName } from './getUserDirectoryByName';

export const resolveUserDirectoryOrThrow = (name: string, qpqConfig: QPQConfig): UserDirectoryQPQConfigSetting => {
  const directory = getUserDirectoryByName(name, qpqConfig);

  if (!directory) {
    throw new Error(`UserDirectory not found: ${name}`);
  }

  return directory;
};
