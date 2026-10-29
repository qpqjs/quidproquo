import { Effect } from '@qpqjs/core';

import { AuthEffect } from './AuthEffect';

export type AuthSetPasswordEffect = Effect<AuthEffect.SetPassword, string>;
