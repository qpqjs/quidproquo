import { createActionRequester } from '../../types';
import { AiActionType } from './AiActionType';
import { AiMessage } from './AiMessage';
import { AiModel } from './AiModel';
import { AiReasoningConfig } from './AiReasoningConfig';

export type AskAiPromptOptions = {
  system?: string;
  aiName?: string;
  messages?: AiMessage[];
  reasoning?: AiReasoningConfig;
  caching?: boolean;
  /** Stop the tool loop between steps once this much wall-clock time has passed. The
   *  turn then finishes with `toolCalls` if the model still wanted to act, so it can be resumed. */
  maxDurationMs?: number;
  /** Cap on model/tool steps in one call. Unset means the loop runs until the model stops
   *  (or `maxDurationMs` trips); client-side tools still halt it immediately. */
  maxSteps?: number;
};

export interface AiPromptActionResult {
  text: string;
}

export const askAiPrompt = createActionRequester<AiPromptActionResult>()({
  actionType: AiActionType.Prompt,
  getPayload: (model: AiModel, prompt: string, options?: AskAiPromptOptions) => ({
    model,
    prompt,
    messages: options?.messages,
    system: options?.system,
    aiName: options?.aiName,
    reasoning: options?.reasoning,
    caching: options?.caching,
    maxDurationMs: options?.maxDurationMs,
    maxSteps: options?.maxSteps,
  }),
});
