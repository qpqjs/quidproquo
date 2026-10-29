import { askKeyValueStoreScanAll, AskResponse } from '@qpqjs/core';

import { Connection } from '../../types/Connection';
import { askConnectionGetStoreName } from './askConnectionGetStoreName';

export function* askConnectionGetAll(): AskResponse<Connection[]> {
  const storeName = yield* askConnectionGetStoreName();

  const connections = yield* askKeyValueStoreScanAll<Connection>(storeName);
  return connections;
}
