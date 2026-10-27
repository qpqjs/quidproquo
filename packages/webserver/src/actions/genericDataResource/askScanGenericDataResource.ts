import { createActionRequester } from 'quidproquo-core';

import GenericDataResourceActionTypeEnum from './GenericDataResourceActionTypeEnum';

export const askScanGenericDataResource = createActionRequester<object[]>()({
  actionType: GenericDataResourceActionTypeEnum.Scan,
  getPayload: (tableName: string, maxItems: number) => ({ tableName, maxItems }),
});
