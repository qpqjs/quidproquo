import { Nullable } from '../../../../types/Nullable';
import { QPQConfig } from '../../../QPQConfig';
import { UserDirectoryQPQConfigSetting } from '../types';
import { getAllUserDirectoryConfigs } from './getAllUserDirectoryConfigs';

export const getUserDirectoryByName = (name: string, qpqConfig: QPQConfig): Nullable<UserDirectoryQPQConfigSetting> =>
  getAllUserDirectoryConfigs(qpqConfig).find((directory) => directory.name === name) ?? null;
