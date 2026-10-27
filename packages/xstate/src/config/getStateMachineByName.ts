import { Nullable, QPQConfig } from 'quidproquo-core';

import { StateMachineQPQConfigSetting } from './settings/stateMachine';
import { getAllStateMachines } from './getAllStateMachines';

/** Returns the state machine setting with the given name, or null when none is configured. */
export const getStateMachineByName = (qpqConfig: QPQConfig, stateMachineName: string): Nullable<StateMachineQPQConfigSetting> => {
  return getAllStateMachines(qpqConfig).find((sm) => sm.stateMachineName === stateMachineName) ?? null;
};
