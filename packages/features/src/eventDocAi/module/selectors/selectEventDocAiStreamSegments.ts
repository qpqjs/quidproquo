import type { EventDocAiMessageSegment } from '../../models';
import type { EventDocAiState } from '../EventDocAiState';

export const selectEventDocAiStreamSegments = (state: EventDocAiState): EventDocAiMessageSegment[] => state.streamSegments;
