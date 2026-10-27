import { type AiMessage, askConfigGetGlobal, askInlineFunctionExecute, AskResponse } from 'quidproquo-core';

import { EVENT_DOC_AI_TURN_CONTEXT_GENERATOR_GLOBAL } from '../constants/eventDocAiGlobalNames';
import type { EventDocAiSystemPromptInput } from '../models';
import { buildEventDocAiTurnContext } from './buildEventDocAiTurnContext';

/**
 * The turn's transport-only context: the configured generator's output for this document, if
 * any, plus the continuation nudge. Built fresh every turn and never persisted; the chat
 * history stores messages only.
 */
export function* askEventDocAiTurnContextResolve(docId: string, isContinuation: boolean): AskResponse<AiMessage[]> {
  const generatorFn = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_TURN_CONTEXT_GENERATOR_GLOBAL);

  const context = generatorFn ? yield* askInlineFunctionExecute<string, EventDocAiSystemPromptInput>(generatorFn, { docId }) : '';

  return buildEventDocAiTurnContext(context, isContinuation);
}
