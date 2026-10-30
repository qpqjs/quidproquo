import { getOwnedItems } from '../../../../logic/config/getOwnedItems';
import { QPQConfig } from '../../../QPQConfig';
import { SecretQPQConfigSetting } from '../types';
import { getAllSecretConfigs } from './getAllSecretConfigs';

export const getOwnedSecretConfigs = (qpqConfig: QPQConfig): SecretQPQConfigSetting[] => getOwnedItems(getAllSecretConfigs(qpqConfig), qpqConfig);
