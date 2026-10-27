import { NeptuneNodeResult } from './NeptuneNodeResult';
import { NeptuneRelationshipResult } from './NeptuneRelationshipResult';
import { NeptuneScalarResult } from './NeptuneScalarResult';

export type AnyNeptuneResult = NeptuneNodeResult | NeptuneRelationshipResult | NeptuneScalarResult;
