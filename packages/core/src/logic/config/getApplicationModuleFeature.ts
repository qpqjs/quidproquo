import { QPQConfig } from '../../config/QPQConfig';
import { getApplicationConfigSetting } from './getApplicationConfigSetting';

export const getApplicationModuleFeature = (qpqConfig: QPQConfig): string | undefined => getApplicationConfigSetting(qpqConfig).feature;
