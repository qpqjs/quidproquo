import { askKeyValueStoreDelete, AskResponse } from '@qpqjs/core';

import { askConnectionGetStoreName } from './askConnectionGetStoreName';

export function* askConnectionDeleteByConnectionId(id: string): AskResponse<void> {
  const storeName = yield* askConnectionGetStoreName();

  yield* askKeyValueStoreDelete(storeName, id);
}
