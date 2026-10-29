import { getConfigSetting } from '../../../../logic/config/getConfigSetting';
import { Nullable } from '../../../../types/Nullable';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { UserScriptRunnerQPQConfigSetting } from '../types';

/** The service's user script sandbox, or null when it declares none. */
export const getUserScriptRunnerConfig = (qpqConfig: QPQConfig): Nullable<UserScriptRunnerQPQConfigSetting> =>
  getConfigSetting<UserScriptRunnerQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.userScriptRunner) ?? null;
