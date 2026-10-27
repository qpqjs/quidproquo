import { AiStreamPartType } from './AiStreamPartType';

/**
 * A single generation step (one model round-trip) has started.
 *
 * Multi-step responses occur when the model invokes tools — each tool round-trip is a step.
 */
export interface AiStreamStartStep {
  type: AiStreamPartType.StartStep;
}
