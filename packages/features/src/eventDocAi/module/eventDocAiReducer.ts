import { buildEffectReducer } from '@qpqjs/core';

import { EventDocAiEffect } from './effects/EventDocAiEffect';
import type { EventDocAiEffects } from './effects/EventDocAiEffects';
import { appendChatMessage } from './stateUpdaters/appendChatMessage';
import { appendStreamChunk } from './stateUpdaters/appendStreamChunk';
import { clearStream } from './stateUpdaters/clearStream';
import { finalizeStream } from './stateUpdaters/finalizeStream';
import { prependChatRows } from './stateUpdaters/prependChatRows';
import { setActiveChat } from './stateUpdaters/setActiveChat';
import { setChatRowContent } from './stateUpdaters/setChatRowContent';
import { setChatRows } from './stateUpdaters/setChatRows';
import { setChats } from './stateUpdaters/setChats';
import { setError } from './stateUpdaters/setError';
import { setLoadingChats } from './stateUpdaters/setLoadingChats';
import { setLoadingHistory } from './stateUpdaters/setLoadingHistory';
import { setMessages } from './stateUpdaters/setMessages';
import { setSending } from './stateUpdaters/setSending';
import { upsertChat } from './stateUpdaters/upsertChat';
import type { EventDocAiState } from './types/EventDocAiState';

export const eventDocAiReducer = buildEffectReducer<EventDocAiState, EventDocAiEffects>({
  [EventDocAiEffect.SetChats]: setChats,
  [EventDocAiEffect.UpsertChat]: upsertChat,
  [EventDocAiEffect.SetActiveChat]: setActiveChat,
  [EventDocAiEffect.SetMessages]: setMessages,
  [EventDocAiEffect.SetChatRows]: setChatRows,
  [EventDocAiEffect.PrependChatRows]: prependChatRows,
  [EventDocAiEffect.SetChatRowContent]: setChatRowContent,
  [EventDocAiEffect.AppendChatMessage]: appendChatMessage,
  [EventDocAiEffect.AppendStreamChunk]: appendStreamChunk,
  [EventDocAiEffect.ClearStream]: clearStream,
  [EventDocAiEffect.FinalizeStream]: finalizeStream,
  [EventDocAiEffect.SetLoadingChats]: setLoadingChats,
  [EventDocAiEffect.SetLoadingHistory]: setLoadingHistory,
  [EventDocAiEffect.SetSending]: setSending,
  [EventDocAiEffect.SetError]: setError,
});
