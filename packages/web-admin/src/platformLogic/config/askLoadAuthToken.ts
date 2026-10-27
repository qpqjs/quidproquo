import { AskResponse, AuthenticateUserResponse } from 'quidproquo-core';

import { getInMemoryAuthToken } from './inMemoryAuthTokenStore';

// Kept as an ask* story so call sites read like every other effect, but the
// read is an in-memory synchronous get — tokens must never be persisted.
export function* askLoadAuthToken(): AskResponse<AuthenticateUserResponse> {
  return getInMemoryAuthToken();
}
