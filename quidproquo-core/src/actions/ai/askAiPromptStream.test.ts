import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, throwsError } from '../../testing';
import { AiActionType } from './AiActionType';
import { AiCacheTtl } from './AiCacheTtl';
import { AiModel } from './AiModel';
import { AiReasoningEffort } from './AiReasoningEffort';
import { askAiPromptStream } from './askAiPromptStream';

describe('askAiPromptStream', () => {
  it('yields a PromptStream action with the model, prompt and options', () => {
    const messages = [{ role: 'user', content: 'hi' }] as any;
    const turnContext = [{ role: 'user', content: 'current state' }] as any;

    const { action } = captureRequester(
      askAiPromptStream(AiModel.ClaudeSonnet45, 'stream it', {
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
      type: AiActionType.PromptStream,
      payload: {
        model: AiModel.ClaudeSonnet45,
        prompt: 'stream it',
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
    const { action } = captureRequester(askAiPromptStream(AiModel.ClaudeHaiku45, 'hello'));

    expect(action).toEqual({
      type: AiActionType.PromptStream,
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

  it('returns the stream result the runtime resolves', () => {
    const result = { text: 'streamed' };
    const { returned } = captureRequester(askAiPromptStream(AiModel.ClaudeHaiku45, 'hello'), result);

    expect(returned).toBe(result);
  });

  it('propagates a processor failure as a thrown story error', () => {
    const failingRun = () =>
      runStory(askAiPromptStream(AiModel.ClaudeHaiku45, 'hello'), {
        [AiActionType.PromptStream]: throwsError('GenericError', 'model unavailable'),
      });

    expect(failingRun).toThrow('GenericError: model unavailable');
  });
});
