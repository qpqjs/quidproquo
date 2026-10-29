import { AiStreamFinishReasonEnum, askGetRuntimeRemainingTime, AskResponse } from '@qpqjs/core';

import type { ServiceRequestDeferred } from '../../webSocketQueue/logic/service';
import { askEventDocAiChatTouch } from '../data/askEventDocAiChatTouch';
import type { EventDocAiChatMessage, EventDocAiChatSendResult } from '../models';
import { askEventDocAiClearStream } from '../module';
import { askEventDocAiContinueHandoff } from './askEventDocAiContinueHandoff';
import { askEventDocAiPromptStreamOpen } from './askEventDocAiPromptStreamOpen';
import { askEventDocAiReplySave } from './askEventDocAiReplySave';
import { askEventDocAiStreamToUi } from './askEventDocAiStreamToUi';
import { askEventDocAiUsageVisible } from './askEventDocAiUsageVisible';
import { eventDocAiSegmentHasPendingToolUse } from './eventDocAiSegmentHasPendingToolUse';
import { getEventDocAiFinishPart } from './getEventDocAiFinishPart';

// Wall-clock kept back from the runtime deadline. The stream's stop condition only
// runs between steps, so one more model call plus the history save must fit inside
// this; running out mid-save loses the reply.
const HANDOFF_HEADROOM_MS = 90_000;

// A step cut off by the output token cap leaves a truncated tool call (saved
// with its error output). Resuming lets the model retry with a smaller call, but
// one that keeps overrunning the cap is stopped after this many resumes.
const MAX_LENGTH_RESUMES = 3;

export type EventDocAiStreamTurnOptions = {
  // Adds the continuation nudge to the turn context so a resumed history ends on a user turn.
  isContinuation: boolean;
  // Consecutive resumes caused by the output token cap so far.
  lengthResumes: number;
};

/**
 * Streams one model reply for an already-saved history and folds it in. Stream
 * parts are transport-only: each is dispatched to the UI as it arrives, then the
 * completed reply is saved as durable segments and dispatched as the finalized
 * message. Hands the turn to a continuation execution (and returns deferred)
 * whenever the runtime deadline gets in the way, before or after streaming.
 */
export function* askEventDocAiStreamTurn(
  docId: string,
  chatId: string,
  history: EventDocAiChatMessage[],
  { isContinuation, lengthResumes }: EventDocAiStreamTurnOptions,
): AskResponse<EventDocAiChatSendResult | ServiceRequestDeferred> {
  const budgetMs = (yield* askGetRuntimeRemainingTime()) - HANDOFF_HEADROOM_MS;

  if (budgetMs <= 0) {
    return yield* askEventDocAiContinueHandoff(chatId, lengthResumes);
  }

  const usageVisible = yield* askEventDocAiUsageVisible();

  const { streamHandle, model } = yield* askEventDocAiPromptStreamOpen(docId, history, isContinuation, budgetMs);

  const assistantParts = yield* askEventDocAiStreamToUi(streamHandle, usageVisible);

  const segments = yield* askEventDocAiReplySave(docId, chatId, history, assistantParts, model, usageVisible);

  yield* askEventDocAiClearStream();

  yield* askEventDocAiChatTouch(docId, chatId);

  // A pending client tool (saved in the history; the client renders it, e.g.
  // as a form) resumes when the answer arrives as the next chat message.
  if (segments.some(eventDocAiSegmentHasPendingToolUse)) {
    // TODO: @joe-coady: Send the tool call frontend request to the frontend via websocket, on this correlation.
    // the toolcall can be completed and send as a message back to the chat here, on another lambda invoke.

    return { complete: false };
  }

  const finishReason = getEventDocAiFinishPart(assistantParts)?.finishReason;

  // 'tool-calls' means the time budget cut the model off mid-work; 'length'
  // means the output cap did. Only a reply that made progress is worth
  // resuming; an empty one would just be cut off again.
  const cutOffByTime = finishReason === AiStreamFinishReasonEnum.toolCalls;
  const cutOffByLength = finishReason === AiStreamFinishReasonEnum.length;

  if (segments.length > 0) {
    if (cutOffByTime) {
      return yield* askEventDocAiContinueHandoff(chatId, 0);
    }

    if (cutOffByLength && lengthResumes < MAX_LENGTH_RESUMES) {
      return yield* askEventDocAiContinueHandoff(chatId, lengthResumes + 1);
    }
  }

  return { complete: !cutOffByTime && !cutOffByLength };
}
