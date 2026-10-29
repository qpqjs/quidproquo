import { Effect } from '@qpqjs/core';

import { AuthEffect } from './AuthEffect';

export type AuthSetUsernameEffect = Effect<AuthEffect.SetUsername, string>;
