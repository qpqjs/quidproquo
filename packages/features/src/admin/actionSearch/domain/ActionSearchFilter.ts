import { ActionSearchFilterOperator } from './ActionSearchFilterOperator';

export type ActionSearchFilter = {
  fieldName: string;
  operator: ActionSearchFilterOperator;

  value?: string | number | boolean;

  rangeStart?: string | number;
  rangeEnd?: string | number;
};
