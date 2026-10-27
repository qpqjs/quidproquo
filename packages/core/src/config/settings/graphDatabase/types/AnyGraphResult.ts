import { GraphNodeResult } from './GraphNodeResult';
import { GraphRelationshipResult } from './GraphRelationshipResult';
import { GraphScalarResult } from './GraphScalarResult';

// Combined result type for nodes, relationships, and scalars
export type AnyGraphResult = GraphNodeResult | GraphRelationshipResult | GraphScalarResult;
