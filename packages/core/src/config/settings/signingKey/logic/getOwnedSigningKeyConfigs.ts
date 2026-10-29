import { getOwnedItems } from '../../../../logic/config/getOwnedItems';
import { QPQConfig } from '../../../QPQConfig';
import { SigningKeyQPQConfigSetting } from '../types';
import { getAllSigningKeyConfigs } from './getAllSigningKeyConfigs';

export const getOwnedSigningKeyConfigs = (qpqConfig: QPQConfig): SigningKeyQPQConfigSetting[] =>
  getOwnedItems(getAllSigningKeyConfigs(qpqConfig), qpqConfig);
