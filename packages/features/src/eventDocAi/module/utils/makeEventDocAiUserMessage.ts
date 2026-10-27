import type { EventDocAiAttachment, EventDocAiChatMessage } from '../../models';

// Attachments lead, text follows — the same order the parts are presented to the
// model (documents first, then the question about them).
export const makeEventDocAiUserMessage = (text: string, attachments: EventDocAiAttachment[] = []): EventDocAiChatMessage => ({
  role: 'user',
  segments: [...attachments.map((attachment) => ({ type: 'file' as const, attachment })), { type: 'text' as const, text }],
});
