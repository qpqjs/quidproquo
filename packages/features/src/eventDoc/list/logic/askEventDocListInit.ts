import { AskResponse } from '@qpqjs/core';

import { askEventDocListSetConfig } from '../actionCreators/askEventDocListSetConfig';
import type { EventDocListConfig } from '../types/EventDocListConfig';
import { askEventDocListLoad } from './askEventDocListLoad';

/** Stores the host-supplied config and loads the first page. */
export function* askEventDocListInit(config: EventDocListConfig): AskResponse<void> {
  yield* askEventDocListSetConfig(config);
  yield* askEventDocListLoad(config.serviceName, config.listBasePath || config.basePath);
}
