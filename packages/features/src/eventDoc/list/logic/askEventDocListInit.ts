import { AskResponse } from 'quidproquo-core';

import { askUIEventDocListSetConfig } from '../actionCreators/askUIEventDocListSetConfig';
import type { EventDocListConfig } from '../types/EventDocListConfig';
import { askEventDocListLoad } from './askEventDocListLoad';

/** Stores the host-supplied config and loads the first page. */
export function* askEventDocListInit(config: EventDocListConfig): AskResponse<void> {
  yield* askUIEventDocListSetConfig(config);
  yield* askEventDocListLoad(config.serviceName, config.listBasePath || config.basePath);
}
