import { KvsAttributePath, KvsUpdate, KvsUpdateAction, KvsUpdateActionType } from 'quidproquo-core';

import { getItemName } from './getItemName';
import { getValueName } from './getValueName';

const getNestedItemName = (attributePath: KvsAttributePath): string => {
  if (!Array.isArray(attributePath)) {
    return getItemName(attributePath);
  }

  const parts = attributePath.map((segment) => {
    if (typeof segment === 'string') {
      return `.${getItemName(segment)}`;
    }

    // Only non-negative integers may be interpolated raw: anything else that
    // sneaks past the types (via JSON payloads) would be stringified straight
    // into the update expression, which is expression injection.
    if (typeof segment === 'number' && Number.isInteger(segment) && segment >= 0) {
      return `[${segment}]`;
    }

    throw new Error(`Invalid attribute path segment: ${JSON.stringify(segment)}`);
  });

  return parts.join('').replace(/^\./, '');
};

const buildSetPart = (update: KvsUpdateAction): string => {
  if (update.value === undefined || update.value === null) {
    throw new Error("Value must be provided for 'SET' action");
  }

  return `${getNestedItemName(update.attributePath)} = ${getValueName(update.value)}`;
};

const buildRemovePart = (update: KvsUpdateAction): string => {
  return getNestedItemName(update.attributePath);
};

const buildAddPart = (update: KvsUpdateAction): string => {
  if (update.value === undefined || update.value === null) {
    throw new Error("Value must be provided for 'ADD' action");
  }

  return `${getNestedItemName(update.attributePath)} ${getValueName(update.value)}`;
};

const buildDeletePart = (update: KvsUpdateAction): string => {
  if (update.value !== undefined && update.value !== null) {
    return `${getNestedItemName(update.attributePath)} ${getValueName(update.value)}`;
  }

  return getNestedItemName(update.attributePath);
};

const buildSetIfNotExistsPart = (update: KvsUpdateAction): string => {
  if (update.value === undefined || update.value === null) {
    throw new Error("Value must be provided for 'SetIfNotExists' action");
  }

  const attrPath = getNestedItemName(update.attributePath);
  return `${attrPath} = if_not_exists(${attrPath}, ${getValueName(update.value)})`;
};

const buildIncrementPart = (update: KvsUpdateAction): string => {
  if (update.value === undefined || update.value === null) {
    throw new Error("Increment value must be provided for 'Increment' action");
  }
  if (update.defaultValue === undefined || update.defaultValue === null) {
    throw new Error("Default value must be provided for 'Increment' action");
  }

  const attrPath = getNestedItemName(update.attributePath);
  return `${attrPath} = if_not_exists(${attrPath}, ${getValueName(update.defaultValue)}) + ${getValueName(update.value)}`;
};

const buildUpdateExpressionPart = (update: KvsUpdateAction): string => {
  switch (update.action) {
    case KvsUpdateActionType.Set:
      return buildSetPart(update);
    case KvsUpdateActionType.Remove:
      return buildRemovePart(update);
    case KvsUpdateActionType.Add:
      return buildAddPart(update);
    case KvsUpdateActionType.Delete:
      return buildDeletePart(update);
    case KvsUpdateActionType.SetIfNotExists:
      return buildSetIfNotExistsPart(update);
    case KvsUpdateActionType.Increment:
      return buildIncrementPart(update);
    default:
      throw new Error(`Invalid update action type: ${update.action}`);
  }
};

// SetIfNotExists and Increment render as SET clauses too.
const setActionTypes = [KvsUpdateActionType.Set, KvsUpdateActionType.SetIfNotExists, KvsUpdateActionType.Increment];

const buildClause = (clause: 'SET' | 'REMOVE' | 'ADD' | 'DELETE', actionTypes: KvsUpdateActionType[], kvsUpdate: KvsUpdate): string => {
  const actions = kvsUpdate.filter((update) => actionTypes.includes(update.action));

  if (actions.length === 0) {
    return '';
  }

  return `${clause} ${actions.map((update) => buildUpdateExpressionPart(update)).join(', ')}`;
};

/**
 * Render a kvs update as a DynamoDB UpdateExpression, grouping actions into
 * SET / REMOVE / ADD / DELETE clauses. Attribute names and values are replaced
 * with hashed placeholders; pair the result with
 * buildUpdateExpressionAttributeNames / buildUpdateExpressionAttributeValues
 * over the same updates.
 */
export const buildDynamoUpdateExpression = (updates: KvsUpdate): string => {
  const clauses = [
    buildClause('SET', setActionTypes, updates),
    buildClause('REMOVE', [KvsUpdateActionType.Remove], updates),
    buildClause('ADD', [KvsUpdateActionType.Add], updates),
    buildClause('DELETE', [KvsUpdateActionType.Delete], updates),
  ].filter((expression) => !!expression);

  return clauses.join(' ');
};
