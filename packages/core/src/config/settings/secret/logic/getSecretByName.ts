import { Nullable } from '../../../../types/Nullable';
import { QPQConfig } from '../../../QPQConfig';
import { SecretQPQConfigSetting } from '../types';
import { getAllSecretConfigs } from './getAllSecretConfigs';

export const getSecretByName = (name: string, qpqConfig: QPQConfig): Nullable<SecretQPQConfigSetting> =>
  getAllSecretConfigs(qpqConfig).find((secret) => secret.key === name) ?? null;
