import {
  ActionProcessorsQPQConfigSetting,
  buildTestQpqConfig,
  BundleEntriesQPQConfigSetting,
  QPQCoreConfigSettingType,
  qpqCoreUtils,
} from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { QPQXStateConfigSettingType } from '../QPQConfig';
import { defineStateMachine, getStateMachineStoreName, StateMachineQPQConfigSetting, StateMachineRuntimeMap } from './stateMachine';

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
    const [kvs, setting] = qpqCoreUtils.flattenQpqConfig(defineStateMachine('order', { config: toggleConfig }));

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

  it('registers its action processors so the runtime can execute state machine actions', () => {
    const settings = qpqCoreUtils.flattenQpqConfig(defineStateMachine('order', { config: toggleConfig }));
    const processors = settings.filter(
      (setting): setting is ActionProcessorsQPQConfigSetting => setting.configSettingType === QPQCoreConfigSettingType.actionProcessors,
    );

    expect(processors).toHaveLength(1);
    expect(processors[0].runtime).toMatchObject({ relativePath: '../../actionProcessor', functionName: 'getStateMachineActionProcessor' });
  });

  it('declares action and guard runtimes as bundle entries so the bundler builds them', () => {
    const actions: StateMachineRuntimeMap = { notify: '/src/notify::notify' };
    const guards: StateMachineRuntimeMap = { canSubmit: '/src/canSubmit::canSubmit' };

    const config = defineStateMachine('order', { config: toggleConfig, actions, guards });
    const bundleEntries = qpqCoreUtils
      .flattenQpqConfig(config)
      .filter((setting): setting is BundleEntriesQPQConfigSetting => setting.configSettingType === QPQCoreConfigSettingType.bundleEntries);

    expect(bundleEntries).toHaveLength(1);
    expect(bundleEntries[0].runtimes).toEqual(['/src/notify::notify', '/src/canSubmit::canSubmit']);
    expect(qpqCoreUtils.getAllSrcEntries(buildTestQpqConfig(config))).toEqual(
      expect.arrayContaining(['/src/notify::notify', '/src/canSubmit::canSubmit']),
    );
  });

  it('declares no bundle entries when there are no actions or guards', () => {
    const config = defineStateMachine('order', { config: toggleConfig });

    expect(config.some((setting) => (setting as BundleEntriesQPQConfigSetting).configSettingType === QPQCoreConfigSettingType.bundleEntries)).toBe(
      false,
    );
  });
});
