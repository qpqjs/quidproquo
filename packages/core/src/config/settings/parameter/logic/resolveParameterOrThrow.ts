import { QPQConfig } from '../../../QPQConfig';
import { ParameterQPQConfigSetting } from '../types';
import { getParameterByName } from './getParameterByName';

export const resolveParameterOrThrow = (name: string, qpqConfig: QPQConfig): ParameterQPQConfigSetting => {
  const parameter = getParameterByName(name, qpqConfig);

  if (!parameter) {
    throw new Error(`Parameter ${name} not found`);
  }

  return parameter;
};
