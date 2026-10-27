import { AiStreamFile } from './AiStreamFile';
import { AiStreamPartType } from './AiStreamPartType';

/**
 * The model produced a file artifact (e.g. an image from a multi-modal model).
 */
export interface AiStreamFilePart {
  type: AiStreamPartType.File;
  file: AiStreamFile;
}
