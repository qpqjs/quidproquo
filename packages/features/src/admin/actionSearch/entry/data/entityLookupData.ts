import { askKeyValueStoreQuery, askKeyValueStoreUpsert, AskResponse, kvsAnd, kvsBetween, kvsEqual, QpqPagedData } from 'quidproquo-core';

import { QPQ_LOG_ENTITY_LOOKUP_KVS_NAME } from '../../constants/qpqLogEntityLookupKvsName';
import { ActionSearchLookupRow } from '../../domain/ActionSearchLookupRow';

const lookupStoreName = QPQ_LOG_ENTITY_LOOKUP_KVS_NAME;

export function* askUpsert(lookupRow: ActionSearchLookupRow): AskResponse<void> {
  yield* askKeyValueStoreUpsert(lookupStoreName, lookupRow);
}

export function* askListLinkKeys(
  lookupKey: string,
  startIsoDateTime: string,
  endIsoDateTime: string,
  nextPageKey?: string,
): AskResponse<QpqPagedData<ActionSearchLookupRow>> {
  // sortValue = `${createdAt}#${linkKey}`; the ISO prefix sorts lexicographically,
  // and the ￿ pad keeps every linkKey suffix inside the end bound
  return yield* askKeyValueStoreQuery<ActionSearchLookupRow>(
    lookupStoreName,
    kvsAnd([kvsEqual('lookupKey', lookupKey), kvsBetween('sortValue', startIsoDateTime, `${endIsoDateTime}#￿`)]),
    {
      nextPageKey,
    },
  );
}
