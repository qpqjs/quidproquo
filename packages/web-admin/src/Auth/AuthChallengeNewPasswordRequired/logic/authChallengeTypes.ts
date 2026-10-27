import { Effect } from 'quidproquo-core';

export type AuthChallengeState = {
  passwordA: string;
  passwordB: string;
};

export enum AuthChallengeEffect {
  SetPasswordA = 'auth/SetPasswordA',
  SetPasswordB = 'auth/SetPasswordB',
}

export type AuthChallengeSetPasswordAEffect = Effect<AuthChallengeEffect.SetPasswordA, string>;
export type AuthChallengeSetPasswordBEffect = Effect<AuthChallengeEffect.SetPasswordB, string>;

export type AuthChallengeEffects = AuthChallengeSetPasswordAEffect | AuthChallengeSetPasswordBEffect;

export type AuthChallengeSetPasswordPayload = {
  email: string;
  session: string;
  challenge: string;
  newPassword: string;
};
