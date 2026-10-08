import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, throwsError } from '../../testing';
import { AiActionType } from './AiActionType';
import { AiCacheTtl } from './AiCacheTtl';
import { AiModel } from './AiModel';
import { AiReasoningEffort } from './AiReasoningEffort';
import { askAiPrompt } from './askAiPrompt';

describe('askAiPrompt', () => {
  it('yields a Prompt action with the model, prompt and options', () => {
    const messages = [{ role: 'user', content: 'hi' }] as any;
    const turnContext = [{ role: 'user', content: 'current state' }] as any;

    const { action } = captureRequester(
      askAiPrompt(AiModel.ClaudeSonnet45, 'do the thing', {
        system: 'be helpful',
        aiName: 'bob',
        messages,
        turnContext,
        reasoning: { effort: AiReasoningEffort.Medium },
        caching: true,
        cacheTtl: AiCacheTtl.OneHour,
      }),
    );

    expect(action).toEqual({
      type: AiActionType.Prompt,
      payload: {
        model: AiModel.ClaudeSonnet45,
        prompt: 'do the thing',
        messages,
        turnContext,
        system: 'be helpful',
        aiName: 'bob',
        reasoning: { effort: AiReasoningEffort.Medium },
        caching: true,
        cacheTtl: AiCacheTtl.OneHour,
      },
    });
  });

  it('maps optional fields to undefined when no options are given', () => {
    const { action } = captureRequester(askAiPrompt(AiModel.ClaudeHaiku45, 'hello'));

    expect(action).toEqual({
      type: AiActionType.Prompt,
      payload: {
        model: AiModel.ClaudeHaiku45,
        prompt: 'hello',
        messages: undefined,
        turnContext: undefined,
        system: undefined,
        aiName: undefined,
        reasoning: undefined,
        caching: undefined,
        cacheTtl: undefined,
      },
    });
  });

  it('returns the completion the runtime resolves', () => {
    const completion = { text: 'done' };
    const { returned } = captureRequester(askAiPrompt(AiModel.ClaudeHaiku45, 'hello'), completion);

    expect(returned).toBe(completion);
  });

  it('propagates a processor failure as a thrown story error', () => {
    const failingRun = () =>
      runStory(askAiPrompt(AiModel.ClaudeHaiku45, 'hello'), {
        [AiActionType.Prompt]: throwsError('GenericError', 'model unavailable'),
      });

    expect(failingRun).toThrow('GenericError: model unavailable');
  });
});
