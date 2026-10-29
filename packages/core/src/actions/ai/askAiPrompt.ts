import { createActionRequester } from '../../logic/actions';
import { AiStreamUsage } from './types/AiStreamUsage';
import { AiActionType } from './AiActionType';
import { AiCacheTtl } from './AiCacheTtl';
import { AiJsonSchema } from './AiJsonSchema';
import { AiMessage } from './AiMessage';
import { AiModel } from './AiModel';
import { AiReasoningConfig } from './AiReasoningConfig';

export type AskAiPromptOptions = {
  system?: string;
  aiName?: string;
  messages?: AiMessage[];
  /** Per-request messages sent after `messages`. They never receive a cache point and the caller
   *  never persists them; with only `prompt`, the prompt becomes the first user message. */
  turnContext?: AiMessage[];
  reasoning?: AiReasoningConfig;
  caching?: boolean;
  /** Requested lifetime of the request's cache points. Unset means `AiCacheTtl.Dynamic`. */
  cacheTtl?: AiCacheTtl;
  /** Stop the tool loop between steps once this much wall-clock time has passed. The
   *  turn then finishes with `toolCalls` if the model still wanted to act, so it can be resumed. */
  maxDurationMs?: number;
  /** Cap on model/tool steps in one call. Unset means the loop runs until the model stops
   *  (or `maxDurationMs` trips); client-side tools still halt it immediately. */
  maxSteps?: number;
  /** Output token cap per model call. Unset uses the provider default (8192 on Bedrock), which a
   *  large tool input plus reasoning can exceed; the step then finishes with `length`. */
  maxOutputTokens?: number;
  /** The reply must be a JSON value matching this schema. It is checked before it is returned, and
   *  a reply that does not match is an `Invalid` action error, never a result. */
  outputSchema?: AiJsonSchema;
  /** With `outputSchema`: how many times a reply that does not match is shown back to the model with
   *  the problems listed, to correct. Each is another model call. Unset means none. */
  outputRepairAttempts?: number;
};

export type AiPromptActionResult = {
  text: string;
  /** The reply, parsed and checked against `outputSchema`. Set only when a schema was given. */
  object?: unknown;
  /** How many repair calls the reply took (see `outputRepairAttempts`). Set only with a schema. */
  repairs?: number;
  /** Token usage summed across every step, when the provider reports it. */
  usage?: AiStreamUsage;
};

export const askAiPrompt = createActionRequester<AiPromptActionResult>()({
  actionType: AiActionType.Prompt,
  getPayload: (model: AiModel, prompt: string, options?: AskAiPromptOptions) => ({
    model,
    prompt,
    messages: options?.messages,
    turnContext: options?.turnContext,
    system: options?.system,
    aiName: options?.aiName,
    reasoning: options?.reasoning,
    caching: options?.caching,
    cacheTtl: options?.cacheTtl,
    maxDurationMs: options?.maxDurationMs,
    maxSteps: options?.maxSteps,
    maxOutputTokens: options?.maxOutputTokens,
    outputSchema: options?.outputSchema,
    outputRepairAttempts: options?.outputRepairAttempts,
  }),
});
