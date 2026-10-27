import {
  askKeyValueStoreUpdateBase,
  KvsCoreDataType,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  KvsUpdate,
  KvsUpdateActionType,
  throwsError,
} from '@qpqjs/core';

type Row = Record<string, unknown>;

export type KvsUpdatePayload = {
  keyValueStoreName: string;
  key: KvsCoreDataType;
  sortKey?: KvsCoreDataType;
  updates: KvsUpdate;
  options?: { scope?: string; condition?: KvsQueryOperation };
};

export type KvsUpdateMockConfig = {
  // Resolve the rows this update targets. Scope-partitioned tests key their tables by
  // scope so isolation is real; flat tests ignore it.
  tableFor: (scope: string | undefined, storeName: string) => Row[];
  keyName: string;
  sortKeyName: string;
  // Called with every scope that reaches the action, for tests asserting scope threading.
  onScope?: (scope: string | undefined) => void;
};

// The write condition as the processors evaluate it: against the stored row, a missing row holding only its keys.
const conditionHolds = (row: Row, operation: KvsQueryOperation): boolean => {
  if ('conditions' in operation) {
    const logical = operation as KvsLogicalOperator;
    const results = logical.conditions.map((condition) => conditionHolds(row, condition));
    return logical.operation === KvsLogicalOperatorType.And ? results.every(Boolean) : results.some(Boolean);
  }

  const condition = operation as KvsQueryCondition;
  const value = row[condition.key] as number | string | undefined | null;

  switch (condition.operation) {
    case KvsQueryOperationType.NotExists:
      return value === undefined || value === null;
    case KvsQueryOperationType.Exists:
      return value !== undefined && value !== null;
    case KvsQueryOperationType.Equal:
      return value === condition.valueA;
    case KvsQueryOperationType.LessThan:
      return value !== undefined && value !== null && value < (condition.valueA as number | string);
    default:
      throw new Error(`Test KVS mock does not support update condition: ${condition.operation}`);
  }
};

// In-memory stand-in for the KeyValueStore/Update action, matching the DynamoDB semantics
// the real processor produces: UpdateItem UPSERTS (a missing row is created from the key),
// Increment renders as `if_not_exists(attr, :default) + :value`, a false `condition` refuses
// the write with ConditionFailed, and the call returns the whole row as stored afterwards
// (ReturnValues ALL_NEW).
//
// Shared by the eventDoc round-trip tests because the append path claims its log index
// through this action, so every test that drives a real append needs it.
export const createKvsUpdateMock =
  ({ tableFor, keyName, sortKeyName, onScope }: KvsUpdateMockConfig) =>
  (action: { payload: KvsUpdatePayload }): Row | ReturnType<typeof throwsError> => {
    const { keyValueStoreName, key, sortKey, updates, options } = action.payload;
    onScope?.(options?.scope);

    const table = tableFor(options?.scope, keyValueStoreName);

    const existing = table.find((item) => item[keyName] === key && (sortKey === undefined || item[sortKeyName] === sortKey));
    const base: Row = { [keyName]: key, ...(sortKey === undefined ? {} : { [sortKeyName]: sortKey }) };

    if (options?.condition && !conditionHolds(existing ?? base, options.condition)) {
      return throwsError(askKeyValueStoreUpdateBase.errorType.ConditionFailed, `KVS update condition failed in ${keyValueStoreName}`);
    }

    let row = existing;

    if (!row) {
      row = base;
      table.push(row);
    }

    for (const update of updates) {
      const attribute = Array.isArray(update.attributePath) ? String(update.attributePath[0]) : update.attributePath;

      switch (update.action) {
        case KvsUpdateActionType.Set:
          row[attribute] = update.value;
          break;

        case KvsUpdateActionType.Increment: {
          const current = typeof row[attribute] === 'number' ? (row[attribute] as number) : (update.defaultValue as number);
          row[attribute] = current + (update.value as number);
          break;
        }

        case KvsUpdateActionType.Remove:
          delete row[attribute];
          break;

        default:
          throw new Error(`Test KVS mock does not support update action: ${update.action}`);
      }
    }

    return { ...row };
  };
