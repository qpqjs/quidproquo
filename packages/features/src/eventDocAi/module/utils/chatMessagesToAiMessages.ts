import type { AiMessage, AiUserMessagePart } from 'quidproquo-core';

import { eventDocAssetPath } from '../../../eventDoc';
import type { EventDocAiChatMessage, EventDocAiMessageSegment } from '../../models';
import { segmentsToText } from './segmentsToText';

const isFileSegment = (segment: EventDocAiMessageSegment): segment is Extract<EventDocAiMessageSegment, { type: 'file' }> => segment.type === 'file';

// History → AiMessages. Messages without attachments keep the flattened text form.
// File segments become drive-referenced AiFileParts (`{ drive, filepath, scope }`, no
// urls) — the action processor resolves them to file contents at prompt time, so
// nothing sensitive or expiring is ever written to logs or session state. `scope` is
// the collection's ambient storage scope (from the caller): a scoped collection stores
// its assets under it, so the model's file read must apply it too or the file is not
// found; undefined for unscoped collections.
export const chatMessagesToAiMessages = (messages: EventDocAiChatMessage[], docStorageDrive: string, docId: string, scope?: string): AiMessage[] =>
  messages.map((message) => {
    const fileSegments = message.segments.filter(isFileSegment);

    if (fileSegments.length === 0) {
      return { role: message.role, content: segmentsToText(message.segments) };
    }

    const content: AiUserMessagePart[] = [
      ...fileSegments.map(({ attachment }) => ({
        type: 'file' as const,
        drive: docStorageDrive,
        filepath: eventDocAssetPath(docId, attachment.assetId),
        scope,
        mediaType: attachment.mediaType,
        filename: attachment.filename,
      })),
      {
        type: 'text' as const,
        text: segmentsToText(message.segments.filter((segment) => !isFileSegment(segment))),
      },
    ];

    return message.role === 'user' ? { role: 'user' as const, content } : { role: 'assistant' as const, content };
  });
