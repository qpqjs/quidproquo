import { ActionSearchFieldDefinition } from '../domain/ActionSearchFieldDefinition';
import { ActionSearchFieldType } from '../domain/ActionSearchFieldType';
import { ActionSearchFilter } from '../domain/ActionSearchFilter';
import { ActionSearchFilterOperator } from '../domain/ActionSearchFilterOperator';

const hasFilterValue = (value: unknown): value is string | number | boolean => value !== undefined && value !== null && value !== '';

const toComparable = (value: unknown, field: ActionSearchFieldDefinition): string | number =>
  field.type === ActionSearchFieldType.Number ? Number(value) : String(value);

const matchesRange = (value: unknown, filter: ActionSearchFilter, field: ActionSearchFieldDefinition): boolean => {
  const comparable = toComparable(value, field);

  if (hasFilterValue(filter.rangeStart) && comparable < toComparable(filter.rangeStart, field)) {
    return false;
  }

  if (hasFilterValue(filter.rangeEnd) && comparable > toComparable(filter.rangeEnd, field)) {
    return false;
  }

  return true;
};

const matchesFilter = (row: Record<string, unknown>, filter: ActionSearchFilter, field: ActionSearchFieldDefinition): boolean => {
  // Lookup-only fields (e.g. email recipient) have no row attribute; the lookup query already applied them
  if (field.hasLookup) {
    return true;
  }

  const value = row[field.name];

  switch (field.operator) {
    case ActionSearchFilterOperator.Equals:
    case ActionSearchFilterOperator.Exact:
      return !hasFilterValue(filter.value) || toComparable(value, field) === toComparable(filter.value, field);

    case ActionSearchFilterOperator.Contains:
      return !hasFilterValue(filter.value) || (typeof value === 'string' && value.includes(String(filter.value)));

    case ActionSearchFilterOperator.Range:
      return matchesRange(value, filter, field);
  }
};

export const matchesActionSearchFilters = (
  row: Record<string, unknown>,
  filters: ActionSearchFilter[],
  fields: ActionSearchFieldDefinition[],
): boolean => {
  for (const filter of filters) {
    const field = fields.find((fieldDefinition) => fieldDefinition.name === filter.fieldName);
    if (!field) {
      continue;
    }

    if (!matchesFilter(row, filter, field)) {
      return false;
    }
  }

  return true;
};
