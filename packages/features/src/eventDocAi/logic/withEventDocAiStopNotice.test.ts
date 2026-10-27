import { type AiStreamError, type AiStreamFinish, AiStreamFinishReasonEnum, AiStreamPartType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_AI_DECLINED_NOTICE } from '../constants/eventDocAiDeclinedNotice';
import { EVENT_DOC_AI_ERROR_NOTICE } from '../constants/eventDocAiErrorNotice';
import { EVENT_DOC_AI_NO_ANSWER_NOTICE } from '../constants/eventDocAiNoAnswerNotice';
import type { EventDocAiMessageSegment } from '../models';
import { withEventDocAiStopNotice } from './withEventDocAiStopNotice';

const finish = (finishReason: AiStreamFinishReasonEnum, rawFinishReason?: string): AiStreamFinish => ({
  type: AiStreamPartType.Finish,
  finishReason,
  usage: {},
  ...(rawFinishReason ? { rawFinishReason } : {}),
});

const error = (message: string): AiStreamError => ({ type: AiStreamPartType.Error, message });

const reasoningOnly: EventDocAiMessageSegment[] = [{ type: 'reasoning', text: 'thinking...' }];
const answered: EventDocAiMessageSegment[] = [{ type: 'text', text: 'Here you go.' }];

describe('withEventDocAiStopNotice', () => {
  it('apologises and quotes the provider message when the request failed', () => {
    const message = "data retention mode 'default' is not available for this model";

    expect(withEventDocAiStopNotice([], [error(message), finish(AiStreamFinishReasonEnum.error)])).toEqual([
      { type: 'text', text: `${EVENT_DOC_AI_ERROR_NOTICE} "${message}"` },
    ]);
  });

  it('apologises without a quote when the stream ended in error with no message', () => {
    expect(withEventDocAiStopNotice(answered, [finish(AiStreamFinishReasonEnum.error)])).toEqual([
      ...answered,
      { type: 'text', text: EVENT_DOC_AI_ERROR_NOTICE },
    ]);
  });

  it('appends the declined notice when the model refused, even after partial text', () => {
    expect(withEventDocAiStopNotice([], [finish(AiStreamFinishReasonEnum.contentFilter)])).toEqual([
      { type: 'text', text: EVENT_DOC_AI_DECLINED_NOTICE },
    ]);
    expect(withEventDocAiStopNotice(answered, [finish(AiStreamFinishReasonEnum.contentFilter)])).toEqual([
      ...answered,
      { type: 'text', text: EVENT_DOC_AI_DECLINED_NOTICE },
    ]);
  });

  it('names the raw stop reason when the model stopped silently for a reason it cannot classify', () => {
    expect(withEventDocAiStopNotice(reasoningOnly, [finish(AiStreamFinishReasonEnum.other, 'model_context_window_exceeded')])).toEqual([
      ...reasoningOnly,
      { type: 'text', text: `${EVENT_DOC_AI_NO_ANSWER_NOTICE} (stop reason: model_context_window_exceeded)` },
    ]);
    expect(withEventDocAiStopNotice([], [finish(AiStreamFinishReasonEnum.unknown)])).toEqual([{ type: 'text', text: EVENT_DOC_AI_NO_ANSWER_NOTICE }]);
  });

  it('leaves a turn that answered, or ended normally, alone', () => {
    expect(withEventDocAiStopNotice(answered, [finish(AiStreamFinishReasonEnum.other)])).toBe(answered);
    expect(withEventDocAiStopNotice(reasoningOnly, [finish(AiStreamFinishReasonEnum.stop)])).toBe(reasoningOnly);
    expect(withEventDocAiStopNotice([], [])).toEqual([]);
  });
});
