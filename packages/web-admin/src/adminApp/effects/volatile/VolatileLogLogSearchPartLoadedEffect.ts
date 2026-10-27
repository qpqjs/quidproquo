import { Effect } from 'quidproquo-core';
import { LogLog } from 'quidproquo-features';

import { VolatileEffect } from './VolatileEffect';

export type VolatileLogLogSearchPartLoadedPayload = {
  searchKey: string;
  logLogs: LogLog[];
};

export type VolatileLogLogSearchPartLoadedEffect = Effect<VolatileEffect.logLogSearchPartLoaded, VolatileLogLogSearchPartLoadedPayload>;
