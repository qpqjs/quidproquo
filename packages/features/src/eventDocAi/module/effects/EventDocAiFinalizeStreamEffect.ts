import type { AiModel, AiStreamUsage, Effect } from '@qpqjs/core';

import type { EventDocAiMessageSegment } from '../../models';
import { EventDocAiEffect } from './EventDocAiEffect';

/**
 * Everything about a finished reply that the browser did not get from the stream. The reply's own
 * content is not here: the browser already folded it from the stream parts.
 */
export type FinalizeStreamPayload = {
  chatId: string;
  model: AiModel;
  // Only when the chat lets usage reach the browser.
  usage?: AiStreamUsage;
  // Segments the server added after the stream ended (a stop notice).
  trailingSegments: EventDocAiMessageSegment[];
  // True when the server held a stream part back, so the browser's copy is known to be incomplete.
  isPartial: boolean;
};

/** Turns the reply streamed so far into a finalized message of the chat. */
export type EventDocAiFinalizeStreamEffect = Effect<EventDocAiEffect.FinalizeStream, FinalizeStreamPayload>;
