import { describe, expect, it } from 'vitest';

import { defineGraphDatabaseNeo4j, Neo4jVersion } from './index';

describe('quidproquo-neo4j', () => {
  it('exposes the config surface from the package root', () => {
    expect(typeof defineGraphDatabaseNeo4j).toBe('function');
    expect(Neo4jVersion.Version5).toBe('version5');
  });
});
