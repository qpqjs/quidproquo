import { LogActionType } from 'quidproquo-core';

import { CoreLogCreateCustomAction, CoreLogDisableEventHistoryCustomAction, CoreLogTemplateLiteralCustomAction } from '../../custom';
import { ActionComponent } from '../../types';

const coreNetworkActionComponentMap: Record<string, ActionComponent> = {
  [LogActionType.Create]: CoreLogCreateCustomAction,
  [LogActionType.TemplateLiteral]: CoreLogTemplateLiteralCustomAction,
  [LogActionType.DisableEventHistory]: CoreLogDisableEventHistoryCustomAction,
};

export default coreNetworkActionComponentMap;
