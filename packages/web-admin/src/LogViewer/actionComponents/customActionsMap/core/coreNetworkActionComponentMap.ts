import { NetworkActionType } from 'quidproquo-core';

import { CoreNetworkRequestCustomAction } from '../../custom';
import { ActionComponent } from '../../types';

const coreNetworkActionComponentMap: Record<string, ActionComponent> = {
  [NetworkActionType.Request]: CoreNetworkRequestCustomAction,
};

export default coreNetworkActionComponentMap;
