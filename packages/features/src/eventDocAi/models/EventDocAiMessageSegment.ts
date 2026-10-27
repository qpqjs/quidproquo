import type { EventDocAiAttachment } from './EventDocAiAttachment';
import type { EventDocAiToolUse } from './EventDocAiToolUse';

// The durable (and render-ready) content format of a chat message. Raw
// AiStreamParts are a streaming-only concept: they're dispatched to the UI
// while a reply is in flight, then folded into segments for saving.
export type EventDocAiMessageSegment =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'file'; attachment: EventDocAiAttachment }
  | { type: 'tool-use'; tools: EventDocAiToolUse[] };
