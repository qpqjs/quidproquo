import { Effect } from '@qpqjs/core';
import { LogLog } from '@qpqjs/features';

import { VolatileEffect } from './VolatileEffect';

export type VolatileLogLogSearchPartLoadedPayload = {
  searchKey: string;
  logLogs: LogLog[];
};

export type VolatileLogLogSearchPartLoadedEffect = Effect<VolatileEffect.logLogSearchPartLoaded, VolatileLogLogSearchPartLoadedPayload>;
