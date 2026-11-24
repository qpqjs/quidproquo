import type { EventDocAiAppendChatMessageEffect } from './EventDocAiAppendChatMessageEffect';
import type { EventDocAiAppendStreamChunkEffect } from './EventDocAiAppendStreamChunkEffect';
import type { EventDocAiClearStreamEffect } from './EventDocAiClearStreamEffect';
import type { EventDocAiFinalizeStreamEffect } from './EventDocAiFinalizeStreamEffect';
import type { EventDocAiPrependChatRowsEffect } from './EventDocAiPrependChatRowsEffect';
import type { EventDocAiSetActiveChatEffect } from './EventDocAiSetActiveChatEffect';
import type { EventDocAiSetChatRowContentEffect } from './EventDocAiSetChatRowContentEffect';
import type { EventDocAiSetChatRowsEffect } from './EventDocAiSetChatRowsEffect';
import type { EventDocAiSetChatsEffect } from './EventDocAiSetChatsEffect';
import type { EventDocAiSetErrorEffect } from './EventDocAiSetErrorEffect';
import type { EventDocAiSetLoadingChatsEffect } from './EventDocAiSetLoadingChatsEffect';
import type { EventDocAiSetLoadingHistoryEffect } from './EventDocAiSetLoadingHistoryEffect';
import type { EventDocAiSetMessagesEffect } from './EventDocAiSetMessagesEffect';
import type { EventDocAiSetSendingEffect } from './EventDocAiSetSendingEffect';
import type { EventDocAiUpsertChatEffect } from './EventDocAiUpsertChatEffect';

export type EventDocAiEffects =
  | EventDocAiSetChatsEffect
  | EventDocAiUpsertChatEffect
  | EventDocAiSetActiveChatEffect
  | EventDocAiSetMessagesEffect
  | EventDocAiSetChatRowsEffect
  | EventDocAiPrependChatRowsEffect
  | EventDocAiSetChatRowContentEffect
  | EventDocAiAppendChatMessageEffect
  | EventDocAiAppendStreamChunkEffect
  | EventDocAiClearStreamEffect
  | EventDocAiFinalizeStreamEffect
  | EventDocAiSetLoadingChatsEffect
  | EventDocAiSetLoadingHistoryEffect
  | EventDocAiSetSendingEffect
  | EventDocAiSetErrorEffect;
