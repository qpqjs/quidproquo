import { createActionRequester } from '@qpqjs/core';

import { GenericDataResourceActionTypeEnum } from './GenericDataResourceActionTypeEnum';

export const askPutGenericDataResource = createActionRequester<object>()({
  actionType: GenericDataResourceActionTypeEnum.Put,
  getPayload: (tableName: string, item: object) => ({ tableName, item }),
});
