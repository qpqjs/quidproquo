import { Nullable } from '../../../../types/Nullable';
import { QPQConfig } from '../../../QPQConfig';
import { CryptoKeyQPQConfigSetting } from '../types';
import { getAllCryptoKeyConfigs } from './getAllCryptoKeyConfigs';

export const getCryptoKeyByName = (name: string, qpqConfig: QPQConfig): Nullable<CryptoKeyQPQConfigSetting> =>
  getAllCryptoKeyConfigs(qpqConfig).find((key) => key.keyName === name) ?? null;
