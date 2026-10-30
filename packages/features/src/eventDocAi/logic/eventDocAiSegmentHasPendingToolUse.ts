import type { EventDocAiMessageSegment } from '../models';

// A tool call with no output after the stream has ended is a client-side tool
// (a config tool with no executor): nothing server-side can resolve it, so the
// turn must be handed to the client instead of resumed.
export const eventDocAiSegmentHasPendingToolUse = (segment: EventDocAiMessageSegment): boolean =>
  segment.type === 'tool-use' && segment.tools.some((tool) => tool.output === undefined);
