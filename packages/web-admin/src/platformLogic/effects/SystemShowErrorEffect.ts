import { Effect } from '@qpqjs/core';

import { SystemEffect } from './SystemEffect';

export type SystemShowErrorPayload = {
  msg: string;
  at: string;
  id: string;
};

export type SystemShowErrorEffect = Effect<SystemEffect.ShowError, SystemShowErrorPayload>;
