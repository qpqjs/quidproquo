import { AiStreamFile } from './AiStreamFile';
import { AiStreamPartType } from './AiStreamPartType';

/**
 * The model produced a reasoning file artifact (e.g. an encrypted reasoning trace).
 */
export interface AiStreamReasoningFilePart {
  type: AiStreamPartType.ReasoningFile;
  file: AiStreamFile;
}
