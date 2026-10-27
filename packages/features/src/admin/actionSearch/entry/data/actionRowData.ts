import {
  askKeyValueStoreQuery,
  askKeyValueStoreQueryAll,
  askKeyValueStoreUpsert,
  AskResponse,
  kvsAnd,
  kvsBetween,
  kvsEqual,
  KvsQueryOperation,
  QpqPagedData,
} from 'quidproquo-core';

import { QPQ_LOG_ACTIONS_KVS_NAME } from '../../constants/qpqLogActionsKvsName';
import { ActionSearchActionRow } from '../../domain/ActionSearchActionRow';

const actionRowStoreName = QPQ_LOG_ACTIONS_KVS_NAME;

export function* askUpsert(actionRow: ActionSearchActionRow): AskResponse<void> {
  yield* askKeyValueStoreUpsert(actionRowStoreName, actionRow);
}

export function* askListByActionType(
  actionType: string,
  startIsoDateTime: string,
  endIsoDateTime: string,
  filter?: KvsQueryOperation,
  nextPageKey?: string,
): AskResponse<QpqPagedData<ActionSearchActionRow>> {
  return yield* askKeyValueStoreQuery<ActionSearchActionRow>(
    actionRowStoreName,
    kvsAnd([kvsEqual('actionType', actionType), kvsBetween('startedAt', startIsoDateTime, endIsoDateTime)]),
    {
      nextPageKey,
      filter,
    },
  );
}

export function* askListAllByLinkKey(linkKey: string): AskResponse<ActionSearchActionRow[]> {
  return yield* askKeyValueStoreQueryAll<ActionSearchActionRow>(actionRowStoreName, kvsEqual('linkKey', linkKey));
}
