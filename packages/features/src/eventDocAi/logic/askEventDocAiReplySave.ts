import { type AiModel, type AiStreamPart, AiStreamPartType, AskResponse } from '@qpqjs/core';

import type { EventDocAiChatMessage, EventDocAiMessageSegment } from '../models';
import { askEventDocAiFinalizeStream, mergeStreamParts } from '../module';
import { askEventDocAiChatMessagesAppend } from './askEventDocAiChatMessagesAppend';
import { askEventDocAiReplyUsage } from './askEventDocAiReplyUsage';
import { isEventDocAiStreamPartForwarded } from './isEventDocAiStreamPartForwarded';
import { withEventDocAiStopNotice } from './withEventDocAiStopNotice';

/**
 * Folds the streamed parts into the durable reply, adds it to the chat and tells the browser to
 * finalize the reply it streamed. The reply itself is never sent again: it can be too big for one
 * websocket message. Returns the saved segments (empty when there was nothing to save).
 */
export function* askEventDocAiReplySave(
  docId: string,
  chatId: string,
  assistantParts: AiStreamPart[],
  model: AiModel,
  usageVisible: boolean,
): AskResponse<EventDocAiMessageSegment[]> {
  const streamedSegments = mergeStreamParts(assistantParts);

  // A turn that failed, was declined, or ended without an answer for a reason this
  // version cannot name saves a notice saying so, so the person is never left with silence.
  const segments = withEventDocAiStopNotice(streamedSegments, assistantParts);

  if (segments.length === 0) {
    return segments;
  }

  // Usage is saved as the client may see it (tokens and the charge, never the platform's cost),
  // whatever the visibility setting says; the setting only decides whether the browser is shown it.
  const usage = yield* askEventDocAiReplyUsage(model, assistantParts);
  const assistantMessage: EventDocAiChatMessage = {
    role: 'assistant',
    segments,
    model,
    ...(usage ? { usage } : {}),
  };

  yield* askEventDocAiChatMessagesAppend(docId, chatId, [assistantMessage]);

  yield* askEventDocAiFinalizeStream({
    chatId,
    model,
    ...(usage && usageVisible ? { usage } : {}),
    // The notice is added here, after the stream, so the browser never streamed it.
    trailingSegments: segments.slice(streamedSegments.length),
    // A part that was held back means the browser's copy of the reply has a hole in it.
    isPartial: !assistantParts.every((part) => part.type === AiStreamPartType.ToolInputDelta || isEventDocAiStreamPartForwarded(part)),
  });

  return segments;
}
