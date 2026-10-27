import { createActionRequester } from 'quidproquo-core';

import GenericDataResourceActionTypeEnum from './GenericDataResourceActionTypeEnum';

export const askPutGenericDataResource = createActionRequester<object>()({
  actionType: GenericDataResourceActionTypeEnum.Put,
  getPayload: (tableName: string, item: object) => ({ tableName, item }),
});
