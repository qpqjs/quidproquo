import { AskResponse, AuthenticateUserResponse } from 'quidproquo-core';

import { setInMemoryAuthToken } from './inMemoryAuthTokenStore';

// Kept as an ask* story so call sites read like every other effect, but the
// write is an in-memory synchronous set — tokens must never be persisted.
export function* askSaveAuthToken(newAuthenticateUserResponse: AuthenticateUserResponse): AskResponse<void> {
  setInMemoryAuthToken(newAuthenticateUserResponse);
}
