import {
  CrossModuleOwner,
  defineActionProcessors,
  defineBundleEntries,
  defineKeyValueStore,
  QPQConfig,
  QPQConfigAdvancedSettings,
  QPQConfigSetting,
  QpqFunctionRuntime,
} from '@qpqjs/core';

import { EventObject, MachineConfig, MachineContext } from 'xstate';

import { QPQXStateConfigSettingType } from '../QPQConfig';

/** Maps xstate action/guard names to the QPQ story runtimes that implement them. */
export type StateMachineRuntimeMap = Record<string, QpqFunctionRuntime>;

export type QPQConfigAdvancedStateMachineSettings = {
  /** The xstate machine definition; action and guard names are resolved through the runtime maps below. */
  config: MachineConfig<MachineContext, EventObject>;
  actions?: StateMachineRuntimeMap;
  guards?: StateMachineRuntimeMap;
  /** The entity field the machine snapshot is persisted under (default '__machineState'). */
  stateField?: string;
  owner?: CrossModuleOwner;
} & QPQConfigAdvancedSettings;

export type StateMachineQPQConfigSetting = {
  stateMachineName: string;
  keyValueStoreName: string;
  config: MachineConfig<MachineContext, EventObject>;
  actions: StateMachineRuntimeMap;
  guards: StateMachineRuntimeMap;
  stateField: string;
} & QPQConfigSetting;

/** Derives the name of the key value store that backs a state machine's entities. */
export const getStateMachineStoreName = (stateMachineName: string): string => `qpq-sm-${stateMachineName}`;

/**
 * Defines a persisted state machine: the setting itself plus the key value
 * store (keyed by 'id') that its entities live in.
 */
export const defineStateMachine = (stateMachineName: string, options: QPQConfigAdvancedStateMachineSettings): QPQConfig => {
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

  // The action/guard stories are only reached through the dynamic module loader, so they have
  // to be declared as bundle entries or the deployed bundle never contains them.
  const storyRuntimes = [...Object.values(stateMachineConfig.actions), ...Object.values(stateMachineConfig.guards)];

  return [
    defineKeyValueStore(keyValueStoreName, 'id'),
    stateMachineConfig,
    defineActionProcessors({ basePath: __dirname, relativePath: '../../actionProcessor', functionName: 'getStateMachineActionProcessor' }),
    ...(storyRuntimes.length > 0 ? [defineBundleEntries(storyRuntimes)] : []),
  ];
};
