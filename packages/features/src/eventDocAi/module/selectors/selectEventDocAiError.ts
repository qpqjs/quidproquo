import type { Nullable } from '@qpqjs/core';

import type { EventDocAiState } from '../EventDocAiState';

export const selectEventDocAiError = (state: EventDocAiState): Nullable<string> => state.error;
