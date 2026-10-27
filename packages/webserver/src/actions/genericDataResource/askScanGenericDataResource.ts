import { createActionRequester } from '@qpqjs/core';

import GenericDataResourceActionTypeEnum from './GenericDataResourceActionTypeEnum';

export const askScanGenericDataResource = createActionRequester<object[]>()({
  actionType: GenericDataResourceActionTypeEnum.Scan,
  getPayload: (tableName: string, maxItems: number) => ({ tableName, maxItems }),
});
