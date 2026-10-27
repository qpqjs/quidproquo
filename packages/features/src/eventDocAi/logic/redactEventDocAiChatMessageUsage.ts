import { omitKey } from '@qpqjs/core';

import type { EventDocAiChatMessage } from '../models';

/** The message without its token usage, for browsers that must not see usage. */
export const redactEventDocAiChatMessageUsage = (message: EventDocAiChatMessage): EventDocAiChatMessage =>
  'usage' in message ? omitKey(message, 'usage') : message;
