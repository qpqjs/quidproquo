import { AskResponse, QpqPagedData } from '@qpqjs/core';

import { askGetAllPagedConnections } from '../../data';
import { Connection } from '../../types';

export function* askWebSocketQueueGetConnections(
  apiName: string,
  onlyAuthorized: boolean,
  nextPageKey?: string,
): AskResponse<QpqPagedData<Connection>> {
  const connections = yield* askGetAllPagedConnections(apiName, onlyAuthorized, nextPageKey);

  return connections;
}
