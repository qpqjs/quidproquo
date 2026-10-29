import { QPQConfig } from '../../../QPQConfig';
import { SigningKeyQPQConfigSetting } from '../types';
import { getSigningKeyByName } from './getSigningKeyByName';

export const resolveSigningKeyOrThrow = (name: string, qpqConfig: QPQConfig): SigningKeyQPQConfigSetting => {
  const key = getSigningKeyByName(name, qpqConfig);

  if (!key) {
    throw new Error(`Can not find signing key [${name}]`);
  }

  return key;
};
