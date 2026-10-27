import { kvsAnd, kvsBetween, kvsContains, kvsEqual, kvsGreaterThanOrEqual, kvsLessThanOrEqual, KvsQueryOperation, Nullable } from 'quidproquo-core';

import { ActionSearchFieldDefinition } from '../domain/ActionSearchFieldDefinition';
import { ActionSearchFieldType } from '../domain/ActionSearchFieldType';
import { ActionSearchFilter } from '../domain/ActionSearchFilter';
import { ActionSearchFilterOperator } from '../domain/ActionSearchFilterOperator';

const hasValue = (value: unknown): value is string | number | boolean => value !== undefined && value !== null && value !== '';

const coerceForField = (value: string | number, field: ActionSearchFieldDefinition): string | number =>
  field.type === ActionSearchFieldType.Number ? Number(value) : value;

const buildRangeCondition = (filter: ActionSearchFilter, field: ActionSearchFieldDefinition): Nullable<KvsQueryOperation> => {
  const hasStart = hasValue(filter.rangeStart);
  const hasEnd = hasValue(filter.rangeEnd);

  if (hasStart && hasEnd) {
    return kvsBetween(field.name, coerceForField(filter.rangeStart!, field), coerceForField(filter.rangeEnd!, field));
  }

  if (hasStart) {
    return kvsGreaterThanOrEqual(field.name, coerceForField(filter.rangeStart!, field));
  }

  if (hasEnd) {
    return kvsLessThanOrEqual(field.name, coerceForField(filter.rangeEnd!, field));
  }

  return null;
};

// The field's declared operator is authoritative; the wire filter only supplies values
const buildFilterCondition = (filter: ActionSearchFilter, field: ActionSearchFieldDefinition): Nullable<KvsQueryOperation> => {
  switch (field.operator) {
    case ActionSearchFilterOperator.Equals:
    case ActionSearchFilterOperator.Exact:
      return hasValue(filter.value) ? kvsEqual(field.name, filter.value) : null;

    case ActionSearchFilterOperator.Contains:
      return hasValue(filter.value) ? kvsContains(field.name, filter.value) : null;

    case ActionSearchFilterOperator.Range:
      return buildRangeCondition(filter, field);
  }
};

export const buildKvsFilterConditions = (filters: ActionSearchFilter[], fields: ActionSearchFieldDefinition[]): Nullable<KvsQueryOperation> => {
  const conditions: KvsQueryOperation[] = [];

  for (const filter of filters) {
    // Unknown field names are dropped: the schema is the whitelist of filterable attributes
    const field = fields.find((fieldDefinition) => fieldDefinition.name === filter.fieldName);
    if (!field) {
      continue;
    }

    const condition = buildFilterCondition(filter, field);
    if (condition) {
      conditions.push(condition);
    }
  }

  if (conditions.length === 0) {
    return null;
  }

  return conditions.length === 1 ? conditions[0] : kvsAnd(conditions);
};
