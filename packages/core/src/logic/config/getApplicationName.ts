import { QPQConfig } from '../../config/QPQConfig';
import { getApplicationConfigSetting } from './getApplicationConfigSetting';

export const getApplicationName = (qpqConfig: QPQConfig): string => getApplicationConfigSetting(qpqConfig).applicationName;
