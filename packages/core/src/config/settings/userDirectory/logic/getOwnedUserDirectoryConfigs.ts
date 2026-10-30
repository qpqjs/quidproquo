import { getOwnedItems } from '../../../../logic/config/getOwnedItems';
import { QPQConfig } from '../../../QPQConfig';
import { UserDirectoryQPQConfigSetting } from '../types';
import { getAllUserDirectoryConfigs } from './getAllUserDirectoryConfigs';

export const getOwnedUserDirectoryConfigs = (qpqConfig: QPQConfig): UserDirectoryQPQConfigSetting[] =>
  getOwnedItems(getAllUserDirectoryConfigs(qpqConfig), qpqConfig);
