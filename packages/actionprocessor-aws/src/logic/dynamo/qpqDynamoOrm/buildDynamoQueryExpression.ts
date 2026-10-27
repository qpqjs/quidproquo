import {
  KvsAdvancedDataType,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
} from 'quidproquo-core';

import { getItemName } from './getItemName';
import { getValueName } from './getValueName';
import { isKvsLogicalOperator } from './isKvsLogicalOperator';
import { isKvsQueryCondition } from './isKvsQueryCondition';

// Fail fast on a missing value: rendering a placeholder for undefined would
// build an expression whose placeholder never appears in
// ExpressionAttributeValues, which DynamoDB rejects with a confusing error.
const getRequiredValueName = (query: KvsQueryCondition, value?: KvsAdvancedDataType): string => {
  if (value === undefined) {
    throw new Error(`Invalid query condition ${query.operation}: missing value for key [${query.key}]`);
  }

  return getValueName(value);
};

const comparisonOperators: Partial<Record<KvsQueryOperationType, string>> = {
  [KvsQueryOperationType.Equal]: '=',
  [KvsQueryOperationType.NotEqual]: '<>',
  [KvsQueryOperationType.LessThan]: '<',
  [KvsQueryOperationType.LessThanOrEqual]: '<=',
  [KvsQueryOperationType.GreaterThan]: '>',
  [KvsQueryOperationType.GreaterThanOrEqual]: '>=',
};

const buildConditionExpression = (query: KvsQueryCondition): string => {
  const itemName = getItemName(query.key);

  switch (query.operation) {
    case KvsQueryOperationType.Equal:
    case KvsQueryOperationType.NotEqual:
    case KvsQueryOperationType.LessThan:
    case KvsQueryOperationType.LessThanOrEqual:
    case KvsQueryOperationType.GreaterThan:
    case KvsQueryOperationType.GreaterThanOrEqual:
      return `${itemName} ${comparisonOperators[query.operation]} ${getRequiredValueName(query, query.valueA)}`;

    case KvsQueryOperationType.Between:
      return `${itemName} BETWEEN ${getRequiredValueName(query, query.valueA)} AND ${getRequiredValueName(query, query.valueB)}`;

    case KvsQueryOperationType.In:
      if (!Array.isArray(query.valueA)) {
        throw new Error(`Invalid query condition ${query.operation}: expected an array of values for key [${query.key}]`);
      }
      return `${itemName} IN (${query.valueA.map((value) => getValueName(value)).join(', ')})`;

    case KvsQueryOperationType.Exists:
      return `attribute_exists(${itemName})`;

    case KvsQueryOperationType.NotExists:
      return `attribute_not_exists(${itemName})`;

    case KvsQueryOperationType.BeginsWith:
      return `begins_with(${itemName}, ${getRequiredValueName(query, query.valueA)})`;

    case KvsQueryOperationType.Contains:
      return `contains(${itemName}, ${getRequiredValueName(query, query.valueA)})`;

    case KvsQueryOperationType.NotContains:
      return `NOT contains(${itemName}, ${getRequiredValueName(query, query.valueA)})`;

    default:
      throw new Error(`Invalid query operation: ${JSON.stringify(query)}`);
  }
};

const buildLogicalExpression = (query: KvsLogicalOperator): string => {
  const joiner = query.operation === KvsLogicalOperatorType.And ? ' AND ' : ' OR ';

  return query.conditions.map((condition) => `(${buildQueryOperationExpression(condition)})`).join(joiner);
};

const buildQueryOperationExpression = (query: KvsQueryOperation): string => {
  if (isKvsQueryCondition(query)) {
    return buildConditionExpression(query);
  }

  if (isKvsLogicalOperator(query)) {
    return buildLogicalExpression(query);
  }

  throw new Error(`Invalid query operation: ${JSON.stringify(query)}`);
};

/**
 * Render a kvs query tree as a DynamoDB expression string. Attribute names and
 * values are replaced with hashed placeholders; pair the result with
 * buildExpressionAttributeNames / buildExpressionAttributeValues over the same
 * queries. Returns undefined (not null) when there is no query so the result
 * can feed optional SDK command fields (FilterExpression and friends) directly.
 */
export const buildDynamoQueryExpression = (query?: KvsQueryOperation): string | undefined => {
  if (!query) {
    return undefined;
  }

  return buildQueryOperationExpression(query);
};
