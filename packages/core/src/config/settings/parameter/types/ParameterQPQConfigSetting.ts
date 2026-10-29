import { QPQConfigSetting } from '../../../QPQConfig';

export type ParameterQPQConfigSetting = {
  key: string;
  value: string;
} & QPQConfigSetting;
