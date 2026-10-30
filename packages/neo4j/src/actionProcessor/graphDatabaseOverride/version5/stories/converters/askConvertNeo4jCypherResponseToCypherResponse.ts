import { AskResponse, GraphCypherResponse, GraphQueryResult } from '@qpqjs/core';

import { Neo4jCypherResponse } from '../types';
import { askConvertAnyNeo4jResultToAnyGraphResult } from './askConvertAnyNeo4jResultToAnyGraphResult';

/**
 * Converts the Neo4j Query API's columnar response (field names + row value
 * arrays) into the qpq shape: one object per row, keyed by field name.
 */
export function* askConvertNeo4jCypherResponseToCypherResponse(neo4jCypherResponse: Neo4jCypherResponse): AskResponse<GraphCypherResponse> {
  const { fields, values } = neo4jCypherResponse.data;

  const results: GraphQueryResult[] = [];
  for (const row of values) {
    const graphQueryResult: GraphQueryResult = {};

    for (const [columnIndex, value] of row.entries()) {
      const field = fields[columnIndex];
      if (field !== undefined) {
        graphQueryResult[field] = yield* askConvertAnyNeo4jResultToAnyGraphResult(value);
      }
    }

    results.push(graphQueryResult);
  }

  return {
    results,
  };
}
