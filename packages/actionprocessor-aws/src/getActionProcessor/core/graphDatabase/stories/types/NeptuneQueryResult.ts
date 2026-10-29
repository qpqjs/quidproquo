import { AnyNeptuneResult } from './AnyNeptuneResult';

// One result row: column name to cell value.
export type NeptuneQueryResult = {
  [key: string]: AnyNeptuneResult;
};
