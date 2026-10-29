import type { Nullable } from '@qpqjs/core';

import type { EventDocAiState } from '../types/EventDocAiState';

export const selectEventDocAiError = (state: EventDocAiState): Nullable<string> => state.error;
