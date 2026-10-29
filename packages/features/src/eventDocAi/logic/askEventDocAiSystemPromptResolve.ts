import { askConfigGetGlobal, askInlineFunctionExecute, AskResponse } from '@qpqjs/core';

import { EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL, EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiSystemPromptInput } from '../models';

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant. Use tools when appropriate.';

// The turn's system prompt: the configured generator inline function, else the
// static configured prompt, else the default. It heads the cached prefix, so it
// must come back identical every turn; per-turn document state travels in the
// turn context instead. Never persisted: the chat history stores messages only.
export function* askEventDocAiSystemPromptResolve(docId: string): AskResponse<string> {
  const generatorFn = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_SYSTEM_PROMPT_GENERATOR_GLOBAL);

  const generatedPrompt = generatorFn ? yield* askInlineFunctionExecute<string, EventDocAiSystemPromptInput>(generatorFn, { docId }) : '';

  const configuredPrompt = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_SYSTEM_PROMPT_GLOBAL);

  return generatedPrompt || configuredPrompt || DEFAULT_SYSTEM_PROMPT;
}
