import {
  KeyValueStoreQPQConfigSetting,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  Nullable,
} from 'quidproquo-core';

export type KvsKeyNarrowing = {
  sql: string;
  params: (string | number)[];
};

/**
 * Best-effort SQL narrowing for a key condition.
 *
 * Only ever a candidate-set reduction: every clause returned is implied by the
 * condition, and the full condition is re-evaluated in JS on each row
 * (evaluateKvsQueryOperation). A gap here makes a query slower, never wrong,
 * so unrecognised shapes just fall back to '1 = 1'.
 */

const noNarrowing = (): KvsKeyNarrowing => ({ sql: '1 = 1', params: [] });

const isBindableKeyValue = (value: unknown): value is string | number => typeof value === 'string' || typeof value === 'number';

// 'pk'/'sk' are the query DSL aliases for the configured key attributes; see
// getConditionValue in evaluateKvsQueryOperation.
const isPkCondition = (condition: KvsQueryCondition, storeConfig: KeyValueStoreQPQConfigSetting): boolean =>
  condition.key === storeConfig.partitionKey.key || condition.key === 'pk';

const isSkCondition = (condition: KvsQueryCondition, storeConfig: KeyValueStoreQPQConfigSetting): boolean =>
  storeConfig.sortKeys.length > 0 && (condition.key === storeConfig.sortKeys[0].key || condition.key === 'sk');

const SK_COMPARISON_SQL: Partial<Record<KvsQueryOperationType, string>> = {
  [KvsQueryOperationType.Equal]: 'sk = ?',
  [KvsQueryOperationType.LessThan]: 'sk < ?',
  [KvsQueryOperationType.LessThanOrEqual]: 'sk <= ?',
  [KvsQueryOperationType.GreaterThan]: 'sk > ?',
  [KvsQueryOperationType.GreaterThanOrEqual]: 'sk >= ?',
};

const buildPkClause = (condition: KvsQueryCondition): Nullable<KvsKeyNarrowing> => {
  if (condition.operation !== KvsQueryOperationType.Equal || !isBindableKeyValue(condition.valueA)) {
    return null;
  }
  return { sql: 'pk = ?', params: [condition.valueA] };
};

const buildSkClause = (condition: KvsQueryCondition): Nullable<KvsKeyNarrowing> => {
  if (condition.operation === KvsQueryOperationType.Between) {
    if (!isBindableKeyValue(condition.valueA) || !isBindableKeyValue(condition.valueB)) {
      return null;
    }
    return { sql: 'sk BETWEEN ? AND ?', params: [condition.valueA, condition.valueB] };
  }

  const comparisonSql = SK_COMPARISON_SQL[condition.operation];
  if (!comparisonSql || !isBindableKeyValue(condition.valueA)) {
    return null;
  }
  return { sql: comparisonSql, params: [condition.valueA] };
};

export const buildKvsKeyNarrowing = (keyCondition: KvsQueryOperation, storeConfig: KeyValueStoreQPQConfigSetting): KvsKeyNarrowing => {
  if (!('conditions' in keyCondition)) {
    const condition = keyCondition as KvsQueryCondition;
    return (isPkCondition(condition, storeConfig) && buildPkClause(condition)) || noNarrowing();
  }

  // In a top-level And every member must hold, so any subset of clauses only
  // widens the candidate set. Or trees get no narrowing - a clause from one
  // branch could drop rows another branch matches.
  const logicalOperator = keyCondition as KvsLogicalOperator;
  if (logicalOperator.operation !== KvsLogicalOperatorType.And) {
    return noNarrowing();
  }

  const clauses: KvsKeyNarrowing[] = [];
  let havePkClause = false;
  let haveSkClause = false;

  for (const member of logicalOperator.conditions) {
    if ('conditions' in member) {
      continue;
    }
    const condition = member as KvsQueryCondition;

    if (!havePkClause && isPkCondition(condition, storeConfig)) {
      const pkClause = buildPkClause(condition);
      if (pkClause) {
        clauses.push(pkClause);
        havePkClause = true;
      }
    } else if (!haveSkClause && isSkCondition(condition, storeConfig)) {
      const skClause = buildSkClause(condition);
      if (skClause) {
        clauses.push(skClause);
        haveSkClause = true;
      }
    }
  }

  if (clauses.length === 0) {
    return noNarrowing();
  }

  return {
    sql: clauses.map((clause) => clause.sql).join(' AND '),
    params: clauses.flatMap((clause) => clause.params),
  };
};
