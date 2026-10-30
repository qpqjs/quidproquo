import { AuthSetAuthInfoEffect } from './AuthSetAuthInfoEffect';
import { AuthSetPasswordEffect } from './AuthSetPasswordEffect';
import { AuthSetUsernameEffect } from './AuthSetUsernameEffect';

export type AuthEffects = AuthSetUsernameEffect | AuthSetPasswordEffect | AuthSetAuthInfoEffect;
