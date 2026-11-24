import { type AiStreamPart, AiStreamPartType } from '@qpqjs/core';

import { EVENT_DOC_AI_STREAM_PART_MAX_BYTES } from '../constants/eventDocAiStreamPartMaxBytes';

/**
 * Whether a stream part is sent to the browser as it arrives. Tool argument fragments never are: a large
 * tool input arrives as hundreds of deltas, and the UI only needs to know a call has started
 * (ToolInputStart) and what it was (ToolCall). A part too big for one websocket message is held back too.
 */
export const isEventDocAiStreamPartForwarded = (part: AiStreamPart): boolean =>
  part.type !== AiStreamPartType.ToolInputDelta && new TextEncoder().encode(JSON.stringify(part)).length <= EVENT_DOC_AI_STREAM_PART_MAX_BYTES;
