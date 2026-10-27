import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineStateMachine } from './settings/stateMachine';
import { getStateMachineByName } from './getStateMachineByName';

const toggleConfig = {
  id: 'toggle',
  initial: 'inactive',
  states: { inactive: {}, active: {} },
} as any;

describe('getStateMachineByName', () => {
  it('returns the matching state machine', () => {
    const config = buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig }));

    expect(getStateMachineByName(config, 'order')?.stateMachineName).toBe('order');
  });

  it('returns null when no state machine matches', () => {
    const config = buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig }));

    expect(getStateMachineByName(config, 'missing')).toBeNull();
  });
});
