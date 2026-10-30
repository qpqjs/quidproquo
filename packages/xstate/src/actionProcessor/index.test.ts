import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { StateMachineActionType } from '../actions';
import { getStateMachineActionProcessor } from './getStateMachineActionProcessor';

describe('getStateMachineActionProcessor', () => {
  it('exposes a processor for every state machine action type', async () => {
    const processors = await getStateMachineActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);

    expect(Object.keys(processors).sort()).toEqual(
      [StateMachineActionType.Create, StateMachineActionType.Get, StateMachineActionType.GetState, StateMachineActionType.SendEvent].sort(),
    );
  });
});
