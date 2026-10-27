import { CrossModuleOwner, defineKeyValueStore, QPQConfigAdvancedSettings, QPQConfigSetting, QpqFunctionRuntime } from 'quidproquo-core';

import { EventObject, MachineConfig, MachineContext } from 'xstate';

import { QPQXStateConfigSettingType } from '../QPQConfig';

/** Maps xstate action/guard names to the QPQ story runtimes that implement them. */
export type StateMachineRuntimeMap = Record<string, QpqFunctionRuntime>;

export interface QPQConfigAdvancedStateMachineSettings extends QPQConfigAdvancedSettings {
  /** The xstate machine definition; action and guard names are resolved through the runtime maps below. */
  config: MachineConfig<MachineContext, EventObject>;
  actions?: StateMachineRuntimeMap;
  guards?: StateMachineRuntimeMap;
  /** The entity field the machine snapshot is persisted under (default '__machineState'). */
  stateField?: string;
  owner?: CrossModuleOwner;
}

export interface StateMachineQPQConfigSetting extends QPQConfigSetting {
  stateMachineName: string;
  keyValueStoreName: string;
  config: MachineConfig<MachineContext, EventObject>;
  actions: StateMachineRuntimeMap;
  guards: StateMachineRuntimeMap;
  stateField: string;
}

/** Derives the name of the key value store that backs a state machine's entities. */
export const getStateMachineStoreName = (stateMachineName: string): string => `qpq-sm-${stateMachineName}`;

/**
 * Defines a persisted state machine: the setting itself plus the key value
 * store (keyed by 'id') that its entities live in.
 */
export const defineStateMachine = (stateMachineName: string, options: QPQConfigAdvancedStateMachineSettings): QPQConfigSetting[] => {
  const keyValueStoreName = getStateMachineStoreName(stateMachineName);
  const stateMachineConfig: StateMachineQPQConfigSetting = {
    configSettingType: QPQXStateConfigSettingType.StateMachine,
    uniqueKey: stateMachineName,

    stateMachineName,
    keyValueStoreName,

    config: options.config,
    actions: options.actions ?? {},
    guards: options.guards ?? {},
    stateField: options.stateField ?? '__machineState',

    owner: options.owner,
  };

  return [defineKeyValueStore(keyValueStoreName, 'id'), stateMachineConfig];
};
