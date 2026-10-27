import { buildEffectReducer } from 'quidproquo-core';

import { EventDocAiEffect } from './effects/EventDocAiEffect';
import type { EventDocAiEffects } from './effects/EventDocAiEffects';
import { appendChatMessage } from './stateUpdaters/appendChatMessage';
import { appendStreamChunk } from './stateUpdaters/appendStreamChunk';
import { clearStream } from './stateUpdaters/clearStream';
import { setActiveChat } from './stateUpdaters/setActiveChat';
import { setChats } from './stateUpdaters/setChats';
import { setError } from './stateUpdaters/setError';
import { setLoadingChats } from './stateUpdaters/setLoadingChats';
import { setLoadingHistory } from './stateUpdaters/setLoadingHistory';
import { setMessages } from './stateUpdaters/setMessages';
import { setSending } from './stateUpdaters/setSending';
import { upsertChat } from './stateUpdaters/upsertChat';
import type { EventDocAiState } from './EventDocAiState';

export const eventDocAiReducer = buildEffectReducer<EventDocAiState, EventDocAiEffects>({
  [EventDocAiEffect.SetChats]: setChats,
  [EventDocAiEffect.UpsertChat]: upsertChat,
  [EventDocAiEffect.SetActiveChat]: setActiveChat,
  [EventDocAiEffect.SetMessages]: setMessages,
  [EventDocAiEffect.AppendChatMessage]: appendChatMessage,
  [EventDocAiEffect.AppendStreamChunk]: appendStreamChunk,
  [EventDocAiEffect.ClearStream]: clearStream,
  [EventDocAiEffect.SetLoadingChats]: setLoadingChats,
  [EventDocAiEffect.SetLoadingHistory]: setLoadingHistory,
  [EventDocAiEffect.SetSending]: setSending,
  [EventDocAiEffect.SetError]: setError,
});
