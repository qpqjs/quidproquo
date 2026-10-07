import type { AiMessage } from 'quidproquo-core';

import { EVENT_DOC_AI_CONTINUATION_NUDGE } from '../constants/eventDocAiContinuationNudge';

/**
 * The per-request messages a turn sends after the saved history: the generated context (live
 * document state) when there is any, then the continuation nudge when resuming, so the last
 * thing the model reads is the instruction to carry on and the request ends on a user turn.
 */
export const buildEventDocAiTurnContext = (context: string, isContinuation: boolean): AiMessage[] => [
  ...(context ? [{ role: 'user' as const, content: context }] : []),
  ...(isContinuation ? [{ role: 'user' as const, content: EVENT_DOC_AI_CONTINUATION_NUDGE }] : []),
];
