import { Nullable } from '../../../../types/Nullable';
import { QPQConfig } from '../../../QPQConfig';
import { SigningKeyQPQConfigSetting } from '../types';
import { getAllSigningKeyConfigs } from './getAllSigningKeyConfigs';

export const getSigningKeyByName = (name: string, qpqConfig: QPQConfig): Nullable<SigningKeyQPQConfigSetting> =>
  getAllSigningKeyConfigs(qpqConfig).find((key) => key.keyName === name) ?? null;
