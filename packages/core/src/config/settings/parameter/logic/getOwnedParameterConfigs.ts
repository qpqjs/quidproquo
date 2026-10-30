import { getOwnedItems } from '../../../../logic/config/getOwnedItems';
import { QPQConfig } from '../../../QPQConfig';
import { ParameterQPQConfigSetting } from '../types';
import { getAllParameterConfigs } from './getAllParameterConfigs';

export const getOwnedParameterConfigs = (qpqConfig: QPQConfig): ParameterQPQConfigSetting[] =>
  getOwnedItems(getAllParameterConfigs(qpqConfig), qpqConfig);
