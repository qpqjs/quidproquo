import type { Nullable } from 'quidproquo-core';

import type { EventDocAiState } from '../EventDocAiState';

export const selectEventDocAiActiveChatId = (state: EventDocAiState): Nullable<string> => state.activeChatId;
