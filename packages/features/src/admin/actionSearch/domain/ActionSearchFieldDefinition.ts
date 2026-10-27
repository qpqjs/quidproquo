import { ActionSearchFieldType } from './ActionSearchFieldType';
import { ActionSearchFilterOperator } from './ActionSearchFilterOperator';

export type ActionSearchFieldDefinition = {
  name: string;
  label: string;
  type: ActionSearchFieldType;
  operator: ActionSearchFilterOperator;
  enumValues?: string[];

  // Exact fields resolvable through the entity lookup table (multi-value fields like email recipients)
  hasLookup?: boolean;
};
