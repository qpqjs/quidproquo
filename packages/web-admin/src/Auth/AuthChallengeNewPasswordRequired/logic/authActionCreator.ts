import { AskResponse, askStateDispatchEffect, AuthenticateUserResponse } from 'quidproquo-core';

import { AuthChallengeEffect, AuthChallengeSetPasswordAEffect, AuthChallengeSetPasswordBEffect } from './authChallengeTypes';

export function* askAuthChallengeSetPasswordA(password: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeSetPasswordAEffect>(AuthChallengeEffect.SetPasswordA, password);
}

export function* askAuthChallengeSetPasswordB(password: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeSetPasswordBEffect>(AuthChallengeEffect.SetPasswordB, password);
}
