import { AskResponse, QpqPagedData } from '@qpqjs/core';

import { askConnectionGetAllPaged } from '../../data';
import { Connection } from '../../types';

export function* askWebSocketQueueGetConnections(
  apiName: string,
  onlyAuthorized: boolean,
  nextPageKey?: string,
): AskResponse<QpqPagedData<Connection>> {
  const connections = yield* askConnectionGetAllPaged(apiName, onlyAuthorized, nextPageKey);

  return connections;
}
