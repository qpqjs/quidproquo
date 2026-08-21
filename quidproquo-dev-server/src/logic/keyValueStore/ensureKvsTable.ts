import { KeyValueStoreQPQConfigSetting } from 'quidproquo-core';

import { DatabaseSync } from 'node:sqlite';

import { quoteSqlIdentifier } from './quoteSqlIdentifier';

// json_extract path as a SQL string literal, key quoted so a dotted or dashed
// attribute name addresses one key rather than a nested path.
const toJsonPathLiteral = (attributeName: string): string => `'$."${attributeName.replace(/'/g, "''")}"'`;

/**
 * Idempotent DDL for one store: the table, plus one expression index per
 * configured GSI. json_extract indexes need no maintenance code and can't
 * drift from the data, unlike the old hand-maintained shadow index tables.
 */
export const ensureKvsTable = (db: DatabaseSync, tableName: string, storeConfig: KeyValueStoreQPQConfigSetting): void => {
  const table = quoteSqlIdentifier(tableName);
  const hasSortKey = storeConfig.sortKeys.length > 0;

  // pk/sk are deliberately untyped: BLOB affinity keeps each value's JS type,
  // and sqlite then orders numbers numerically (and before text), matching
  // dynamo's typed keys without CASTs.
  //
  // scope uses '' for unscoped, not NULL. NULLs are allowed (and never equal)
  // in a rowid-table primary key, so NULL scopes would break uniqueness and
  // need IS NULL in every predicate. validateScopeSegment rejects an empty
  // scope, so '' can't collide with a real one.
  const keyColumns = hasSortKey ? 'pk, sk' : 'pk';
  db.exec(
    `CREATE TABLE IF NOT EXISTS ${table} (
      scope TEXT NOT NULL DEFAULT '',
      ${keyColumns},
      data TEXT NOT NULL,
      PRIMARY KEY (scope, ${keyColumns})
    )`,
  );

  for (const index of storeConfig.indexes) {
    const indexedAttributes = [index.partitionKey.key, ...(index.sortKey ? [index.sortKey.key] : [])];
    const indexName = quoteSqlIdentifier(`${tableName}_gsi_${indexedAttributes.join('_')}`);
    const indexedExpressions = indexedAttributes.map((attributeName) => `json_extract(data, ${toJsonPathLiteral(attributeName)})`);

    db.exec(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} (scope, ${indexedExpressions.join(', ')})`);
  }
};
