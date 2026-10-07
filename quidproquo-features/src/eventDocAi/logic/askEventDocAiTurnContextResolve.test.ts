import { ConfigActionType, InlineFunctionActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_AI_CONTINUATION_NUDGE } from '../constants/eventDocAiContinuationNudge';
import { EVENT_DOC_AI_TURN_CONTEXT_GENERATOR_GLOBAL } from '../constants/eventDocAiGlobalNames';
import { askEventDocAiTurnContextResolve } from './askEventDocAiTurnContextResolve';

const generatorGlobal = (generator: string) => (action: { payload: { globalName: string } }) =>
  action.payload.globalName === EVENT_DOC_AI_TURN_CONTEXT_GENERATOR_GLOBAL ? generator : '';

describe('askEventDocAiTurnContextResolve', () => {
  it('returns no messages for a fresh turn when no generator is configured', () => {
    const executions: unknown[] = [];

    const result = runStory(askEventDocAiTurnContextResolve('doc-1', false), {
      [ConfigActionType.GetGlobal]: generatorGlobal(''),
      [InlineFunctionActionType.Execute]: (action: { payload: unknown }) => {
        executions.push(action.payload);
        return 'never';
      },
    });

    expect(result).toEqual([]);
    expect(executions).toEqual([]);
  });

  it('runs the generator with the trusted docId and sends its text as a user message', () => {
    let executed: unknown;

    const result = runStory(askEventDocAiTurnContextResolve('doc-1', false), {
      [ConfigActionType.GetGlobal]: generatorGlobal('buildContext'),
      [InlineFunctionActionType.Execute]: (action: { payload: unknown }) => {
        executed = action.payload;
        return 'Doc state: v3';
      },
    });

    expect(executed).toEqual({ functionName: 'buildContext', payload: { docId: 'doc-1' } });
    expect(result).toEqual([{ role: 'user', content: 'Doc state: v3' }]);
  });

  it('adds the continuation nudge after the context when resuming', () => {
    const result = runStory(askEventDocAiTurnContextResolve('doc-1', true), {
      [ConfigActionType.GetGlobal]: generatorGlobal('buildContext'),
      [InlineFunctionActionType.Execute]: 'Doc state: v3',
    });

    expect(result).toEqual([
      { role: 'user', content: 'Doc state: v3' },
      { role: 'user', content: EVENT_DOC_AI_CONTINUATION_NUDGE },
    ]);
  });

  it('sends only the nudge when resuming and the generator returns nothing', () => {
    const result = runStory(askEventDocAiTurnContextResolve('doc-1', true), {
      [ConfigActionType.GetGlobal]: generatorGlobal('buildContext'),
      [InlineFunctionActionType.Execute]: '',
    });

    expect(result).toEqual([{ role: 'user', content: EVENT_DOC_AI_CONTINUATION_NUDGE }]);
  });
});
