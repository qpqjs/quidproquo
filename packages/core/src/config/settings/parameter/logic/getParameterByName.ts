import { Nullable } from '../../../../types/Nullable';
import { QPQConfig } from '../../../QPQConfig';
import { ParameterQPQConfigSetting } from '../types';
import { getAllParameterConfigs } from './getAllParameterConfigs';

export const getParameterByName = (name: string, qpqConfig: QPQConfig): Nullable<ParameterQPQConfigSetting> =>
  getAllParameterConfigs(qpqConfig).find((parameter) => parameter.key === name) ?? null;
