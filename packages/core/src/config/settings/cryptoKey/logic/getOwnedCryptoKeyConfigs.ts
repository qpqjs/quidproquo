import { getOwnedItems } from '../../../../logic/config/getOwnedItems';
import { QPQConfig } from '../../../QPQConfig';
import { CryptoKeyQPQConfigSetting } from '../types';
import { getAllCryptoKeyConfigs } from './getAllCryptoKeyConfigs';

export const getOwnedCryptoKeyConfigs = (qpqConfig: QPQConfig): CryptoKeyQPQConfigSetting[] =>
  getOwnedItems(getAllCryptoKeyConfigs(qpqConfig), qpqConfig);
