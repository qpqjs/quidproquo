import { type AiModel, type AiStreamPart, AskResponse } from '@qpqjs/core';

import { askEventDocAiChatHistorySave } from '../data/askEventDocAiChatHistorySave';
import type { EventDocAiChatMessage, EventDocAiMessageSegment } from '../models';
import { askUIEventDocAiAppendChatMessage, mergeStreamParts } from '../module';
import { getEventDocAiStreamUsage } from './getEventDocAiStreamUsage';
import { redactEventDocAiChatMessageUsage } from './redactEventDocAiChatMessageUsage';
import { withEventDocAiStopNotice } from './withEventDocAiStopNotice';

// Folds the streamed parts into the durable reply, saves it onto the history and shows
// the finalized message. Returns the saved segments (empty when there was nothing to save).
export function* askEventDocAiReplySave(
  docId: string,
  chatId: string,
  history: EventDocAiChatMessage[],
  assistantParts: AiStreamPart[],
  model: AiModel,
  usageVisible: boolean,
): AskResponse<EventDocAiMessageSegment[]> {
  // A turn that failed, was declined, or ended without an answer for a reason this
  // version cannot name saves a notice saying so, so the person is never left with silence.
  const segments = withEventDocAiStopNotice(mergeStreamParts(assistantParts), assistantParts);

  if (segments.length === 0) {
    return segments;
  }

  // Usage is saved whatever the visibility setting says; the setting only decides what the
  // browser is shown.
  const usage = getEventDocAiStreamUsage(assistantParts);
  const assistantMessage: EventDocAiChatMessage = {
    role: 'assistant',
    segments,
    model,
    ...(usage ? { usage } : {}),
  };

  yield* askEventDocAiChatHistorySave(docId, chatId, [...history, assistantMessage]);

  yield* askUIEventDocAiAppendChatMessage(usageVisible ? assistantMessage : redactEventDocAiChatMessageUsage(assistantMessage));

  return segments;
}
