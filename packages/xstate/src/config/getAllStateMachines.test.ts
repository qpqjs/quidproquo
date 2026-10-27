import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineStateMachine } from './settings/stateMachine';
import { getAllStateMachines } from './getAllStateMachines';

const toggleConfig = {
  id: 'toggle',
  initial: 'inactive',
  states: { inactive: {}, active: {} },
} as any;

describe('getAllStateMachines', () => {
  it('returns every state machine setting in the config', () => {
    const config = buildTestQpqConfig([
      ...defineStateMachine('order', { config: toggleConfig }),
      ...defineStateMachine('payment', { config: toggleConfig }),
    ]);

    expect(getAllStateMachines(config).map((sm) => sm.stateMachineName)).toEqual(['order', 'payment']);
  });

  it('returns an empty list when none are defined', () => {
    expect(getAllStateMachines(buildTestQpqConfig())).toEqual([]);
  });
});
