import { type AiStreamError, type AiStreamFinish, AiStreamFinishReasonEnum, type AiStreamPart, AiStreamPartType } from 'quidproquo-core';

import { EVENT_DOC_AI_DECLINED_NOTICE } from '../constants/eventDocAiDeclinedNotice';
import { EVENT_DOC_AI_ERROR_NOTICE } from '../constants/eventDocAiErrorNotice';
import { EVENT_DOC_AI_NO_ANSWER_NOTICE } from '../constants/eventDocAiNoAnswerNotice';
import type { EventDocAiMessageSegment } from '../models';

const hasAnswer = (segments: EventDocAiMessageSegment[]): boolean => segments.some((segment) => segment.type !== 'reasoning');

const withText = (segments: EventDocAiMessageSegment[], text: string): EventDocAiMessageSegment[] => [...segments, { type: 'text', text }];

/**
 * The reply's segments with a text notice appended when the turn ended without an answer the
 * person can see. A failed request gets an apology quoting the provider's message, a declined
 * request always gets a notice, and a stop this version cannot name gets one when nothing but
 * reasoning came back. A turn that ends in text or tool use is left alone.
 */
export const withEventDocAiStopNotice = (segments: EventDocAiMessageSegment[], parts: AiStreamPart[]): EventDocAiMessageSegment[] => {
  const error = parts.find((part): part is AiStreamError => part.type === AiStreamPartType.Error);
  const finish = parts.find((part): part is AiStreamFinish => part.type === AiStreamPartType.Finish);

  if (error || finish?.finishReason === AiStreamFinishReasonEnum.error) {
    return withText(segments, error ? `${EVENT_DOC_AI_ERROR_NOTICE} "${error.message}"` : EVENT_DOC_AI_ERROR_NOTICE);
  }

  if (finish?.finishReason === AiStreamFinishReasonEnum.contentFilter) {
    return withText(segments, EVENT_DOC_AI_DECLINED_NOTICE);
  }

  const unexplained = finish?.finishReason === AiStreamFinishReasonEnum.other || finish?.finishReason === AiStreamFinishReasonEnum.unknown;
  if (unexplained && !hasAnswer(segments)) {
    const detail = finish?.rawFinishReason ? ` (stop reason: ${finish.rawFinishReason})` : '';
    return withText(segments, `${EVENT_DOC_AI_NO_ANSWER_NOTICE}${detail}`);
  }

  return segments;
};
