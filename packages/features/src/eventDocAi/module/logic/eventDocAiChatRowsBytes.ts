import type { EventDocAiChatRow } from '../../models';

/** The size of some chat rows as they travel: their JSON in UTF-8 bytes. */
export const eventDocAiChatRowsBytes = (rows: EventDocAiChatRow[]): number => new TextEncoder().encode(JSON.stringify(rows)).length;
