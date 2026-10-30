import type { EventDocAiMessageSegment } from '../../models';
import type { EventDocAiState } from '../types/EventDocAiState';

export const selectEventDocAiStreamSegments = (state: EventDocAiState): EventDocAiMessageSegment[] => state.streamSegments;
