import { AiModel } from '../AiModel';
import { AiTokenRates } from './AiTokenRates';

/** Token rates for each model that has them, in US dollars per million tokens. */
export type AiModelTokenRates = Partial<Record<AiModel, AiTokenRates>>;
