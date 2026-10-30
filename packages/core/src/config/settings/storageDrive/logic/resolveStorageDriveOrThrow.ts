import { QPQConfig } from '../../../QPQConfig';
import { StorageDriveQPQConfigSetting } from '../types';
import { getStorageDriveByName } from './getStorageDriveByName';

export const resolveStorageDriveOrThrow = (name: string, qpqConfig: QPQConfig): StorageDriveQPQConfigSetting => {
  const drive = getStorageDriveByName(name, qpqConfig);

  if (!drive) {
    throw new Error(`Could not find storage drive config for [${name}]`);
  }

  return drive;
};
