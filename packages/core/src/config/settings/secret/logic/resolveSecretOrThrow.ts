import { QPQConfig } from '../../../QPQConfig';
import { SecretQPQConfigSetting } from '../types';
import { getSecretByName } from './getSecretByName';

export const resolveSecretOrThrow = (name: string, qpqConfig: QPQConfig): SecretQPQConfigSetting => {
  const secret = getSecretByName(name, qpqConfig);

  if (!secret) {
    throw new Error(`Can not find secret [${name}]`);
  }

  return secret;
};
