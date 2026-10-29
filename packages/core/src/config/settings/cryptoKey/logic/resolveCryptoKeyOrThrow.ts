import { QPQConfig } from '../../../QPQConfig';
import { CryptoKeyQPQConfigSetting } from '../types';
import { getCryptoKeyByName } from './getCryptoKeyByName';

export const resolveCryptoKeyOrThrow = (name: string, qpqConfig: QPQConfig): CryptoKeyQPQConfigSetting => {
  const key = getCryptoKeyByName(name, qpqConfig);

  if (!key) {
    throw new Error(`Can not find crypto key [${name}]`);
  }

  return key;
};
