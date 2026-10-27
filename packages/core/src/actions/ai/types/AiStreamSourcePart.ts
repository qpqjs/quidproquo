import { AiStreamPartType } from './AiStreamPartType';
import { AiStreamSource } from './AiStreamSource';

/**
 * The model cited a source while generating its response — emitted for grounded / RAG answers.
 */
export interface AiStreamSourcePart {
  type: AiStreamPartType.Source;
  source: AiStreamSource;
}
