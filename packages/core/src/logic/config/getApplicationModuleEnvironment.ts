import { QPQConfig } from '../../config/QPQConfig';
import { DEFAULT_ENVIRONMENT } from './DEFAULT_ENVIRONMENT';
import { getApplicationConfigSetting } from './getApplicationConfigSetting';

export const getApplicationModuleEnvironment = (qpqConfig: QPQConfig): string =>
  getApplicationConfigSetting(qpqConfig).environment || DEFAULT_ENVIRONMENT;
