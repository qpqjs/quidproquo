import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askExecuteStory } from './askExecuteStory';
import { SystemActionType } from './SystemActionType';

describe('askExecuteStory', () => {
  it('yields an ExecuteStory action with runtime, params and session', () => {
    const runtime = '/handlers/greet::default' as const;
    const params = ['Ada', 42] as [string, number];
    const storySession = { correlation: 'corr-1' } as any;

    const { action } = captureRequester(askExecuteStory(runtime, params, storySession));

    expect(action).toEqual({
      type: SystemActionType.ExecuteStory,
      payload: { runtime, params, storySession },
    });
  });

  it('leaves the session undefined when omitted', () => {
    const runtime = '/handlers/greet::default' as const;

    const { action } = captureRequester(askExecuteStory(runtime, ['Ada']));

    expect(action.payload).toEqual({ runtime, params: ['Ada'], storySession: undefined });
  });

  it('returns the story output the runtime resolves', () => {
    const runtime = '/handlers/greet::default' as const;

    const { returned } = captureRequester(askExecuteStory(runtime, ['Ada']), 'Hello Ada');

    expect(returned).toBe('Hello Ada');
  });

  it('propagates an execution failure as a thrown error', () => {
    const run = () =>
      runStory(askExecuteStory('/handlers/greet::default', ['Ada']), {
        [SystemActionType.ExecuteStory]: throwsError('NotFound', 'story module not found'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('story module not found');
  });
});
