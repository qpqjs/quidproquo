import { Neo4jNodeResult } from './Neo4jNodeResult';
import { Neo4jRelationshipResult } from './Neo4jRelationshipResult';
import { Neo4jScalarResult } from './Neo4jScalarResult';

export type AnyNeo4jResult = Neo4jNodeResult | Neo4jRelationshipResult | Neo4jScalarResult;
