import { AuthenticateUserResponse, Effect } from '@qpqjs/core';

import { AuthEffect } from './AuthEffect';

export type AuthSetAuthInfoEffect = Effect<AuthEffect.SetAuthInfo, AuthenticateUserResponse>;
