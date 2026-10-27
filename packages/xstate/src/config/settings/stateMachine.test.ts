import { QPQCoreConfigSettingType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { QPQXStateConfigSettingType } from '../QPQConfig';
import { defineStateMachine, getStateMachineStoreName, StateMachineQPQConfigSetting } from './stateMachine';

const toggleConfig = {
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: { on: { TOGGLE: 'active' } },
    active: { on: { TOGGLE: 'inactive' } },
  },
} as any;

describe('getStateMachineStoreName', () => {
  it('prefixes the state machine name with qpq-sm-', () => {
    expect(getStateMachineStoreName('order')).toBe('qpq-sm-order');
  });
});

describe('defineStateMachine', () => {
  it('returns a backing key value store and the state machine setting', () => {
    const [kvs, setting] = defineStateMachine('order', { config: toggleConfig });

    expect(kvs.configSettingType).toBe(QPQCoreConfigSettingType.keyValueStore);
    expect(setting).toEqual({
      configSettingType: QPQXStateConfigSettingType.StateMachine,
      uniqueKey: 'order',
      stateMachineName: 'order',
      keyValueStoreName: 'qpq-sm-order',
      config: toggleConfig,
      actions: {},
      guards: {},
      stateField: '__machineState',
      owner: undefined,
    });
  });

  it('defaults actions, guards and stateField when omitted', () => {
    const [, setting] = defineStateMachine('order', { config: toggleConfig }) as [unknown, StateMachineQPQConfigSetting];

    expect(setting.actions).toEqual({});
    expect(setting.guards).toEqual({});
    expect(setting.stateField).toBe('__machineState');
  });

  it('uses the supplied actions, guards, stateField and owner', () => {
    const actions = { notify: 'notify::runtime' as any };
    const guards = { canSubmit: 'canSubmit::runtime' as any };
    const owner = { module: 'orders' } as any;

    const [, setting] = defineStateMachine('order', {
      config: toggleConfig,
      actions,
      guards,
      stateField: 'state',
      owner,
    }) as [unknown, StateMachineQPQConfigSetting];

    expect(setting.actions).toBe(actions);
    expect(setting.guards).toBe(guards);
    expect(setting.stateField).toBe('state');
    expect(setting.owner).toBe(owner);
  });
});
