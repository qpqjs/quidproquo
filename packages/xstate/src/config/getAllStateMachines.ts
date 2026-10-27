import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { StateMachineQPQConfigSetting } from './settings/stateMachine';
import { QPQXStateConfigSettingType } from './QPQConfig';

/** Returns every state machine setting in the config. */
export const getAllStateMachines = (qpqConfig: QPQConfig): StateMachineQPQConfigSetting[] => {
  return qpqCoreUtils.getConfigSettings<StateMachineQPQConfigSetting>(qpqConfig, QPQXStateConfigSettingType.StateMachine);
};
