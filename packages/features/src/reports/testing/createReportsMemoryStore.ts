import {
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
} from '@qpqjs/core';
import { throwsError } from '@qpqjs/testing';

import { createKvsUpdateMock, KvsUpdatePayload } from '../../eventDoc/testing/kvsUpdateActionMock';

type Row = Record<string, any>;

const matches = (row: Row, operation: KvsQueryOperation): boolean => {
  if ('conditions' in operation) {
    const { conditions, operation: logical } = operation as KvsLogicalOperator;

    return logical === KvsLogicalOperatorType.And
      ? conditions.every((condition) => matches(row, condition))
      : conditions.some((condition) => matches(row, condition));
  }

  const { key, operation: type, valueA, valueB } = operation as KvsQueryCondition;
  const value = row[key];

  switch (type) {
    case KvsQueryOperationType.Equal:
      return value === valueA;
    case KvsQueryOperationType.GreaterThan:
      return value > (valueA as number);
    case KvsQueryOperationType.LessThanOrEqual:
      return value <= (valueA as number);
    case KvsQueryOperationType.Between:
      return value >= (valueA as number) && value <= (valueB as number);
    default:
      throw new Error(`the in-memory store does not handle ${type}`);
  }
};

// A small in-memory key value store: every report store row by store, scope and key, with conditional writes.
/**
 * An in-memory stand-in for a report's stores, keyed by store, scope and key, with conditional writes, for runStory
 * tests that append through the consumer and read back through the real EventDoc read path. `reportName` names the stores.
 */
export const createReportsMemoryStore = (reportName: string) => {
  const LISTS_STORE = `${reportName}ReportsLists`;
  const EVENTS_STORE = `${reportName}ReportsEvents`;
  const rows = new Map<string, Row & { store: string; scope?: string }>();
  const keyOf = (store: string, scope: string | undefined, item: Row): string =>
    store === LISTS_STORE ? `${store}|${scope}|${item.pk}|${item.id}` : `${store}|${scope}|${item.pk}|${item.sk}`;
  const write = (store: string, items: Row[], options?: { ifNotExists?: boolean; scope?: string }) => {
    if (options?.ifNotExists && items.some((item) => rows.has(keyOf(store, options.scope, item)))) {
      return throwsError('Conflict', 'slot taken');
    }
    items.forEach((item) => rows.set(keyOf(store, options?.scope, item), { ...item, store, scope: options?.scope }));
    return undefined;
  };

  const mocks = {
    [KeyValueStoreActionType.Query]: (action: {
      payload: { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: { scope?: string; sortAscending?: boolean; limit?: number } };
    }) => {
      const { keyValueStoreName, keyCondition, options } = action.payload;
      const found = [...rows.values()]
        .filter((row) => row.store === keyValueStoreName && row.scope === options?.scope && matches(row, keyCondition))
        .sort((a, b) => (options?.sortAscending === false ? b.sk - a.sk : a.sk - b.sk));

      return { items: options?.limit ? found.slice(0, options.limit) : found, nextPageKey: undefined };
    },
    // The list view rows are written by guarded updates. The shared mock works on a table, so it is handed this
    // store's rows for the scope, and a row it creates is filed back under its key.
    [KeyValueStoreActionType.Update]: (action: { payload: KvsUpdatePayload }) => {
      const { keyValueStoreName, options } = action.payload;
      const table: Row[] = [...rows.values()].filter((row) => row.store === keyValueStoreName && row.scope === options?.scope);
      const known = table.length;

      const updated = createKvsUpdateMock({ tableFor: () => table, keyName: 'pk', sortKeyName: 'id' })(action);

      table.slice(known).forEach((row) => {
        rows.set(keyOf(keyValueStoreName, options?.scope, row), Object.assign(row, { store: keyValueStoreName, scope: options?.scope }));
      });

      return updated;
    },
    [KeyValueStoreActionType.Upsert]: (action: {
      payload: { keyValueStoreName: string; item: Row; options?: { ifNotExists?: boolean; scope?: string } };
    }) => write(action.payload.keyValueStoreName, [action.payload.item], action.payload.options),
    [KeyValueStoreActionType.UpsertMany]: (action: {
      payload: { keyValueStoreName: string; items: Row[]; options?: { ifNotExists?: boolean; scope?: string } };
    }) => write(action.payload.keyValueStoreName, action.payload.items, action.payload.options),
  };

  const logRows = (scope?: string) =>
    [...rows.values()]
      .filter((row) => row.store === EVENTS_STORE && row.scope === scope)
      .sort((a, b) => `${a.pk}${a.sk}`.localeCompare(`${b.pk}${b.sk}`));

  return { mocks, rows, logRows };
};
