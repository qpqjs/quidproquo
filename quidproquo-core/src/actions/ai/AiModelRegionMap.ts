import { AiDataRegion } from './AiDataRegion';
import { AiModel } from './AiModel';

/** The regions each model is offered in on the current platform; a model may be in several. */
export type AiModelRegionMap = Record<AiModel, AiDataRegion[]>;
