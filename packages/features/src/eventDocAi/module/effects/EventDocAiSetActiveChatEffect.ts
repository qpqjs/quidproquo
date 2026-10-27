import type { Effect } from '@qpqjs/core';
import type { Nullable } from '@qpqjs/core';

import { EventDocAiEffect } from './EventDocAiEffect';

export type SetActiveChatPayload = {
  chatId: Nullable<string>;
};

export type EventDocAiSetActiveChatEffect = Effect<EventDocAiEffect.SetActiveChat, SetActiveChatPayload>;
