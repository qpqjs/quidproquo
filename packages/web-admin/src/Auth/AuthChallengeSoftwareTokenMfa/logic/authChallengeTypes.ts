import { Effect } from 'quidproquo-core';

export type AuthChallengeMfaState = {
  mfaCode: string;
};

export enum AuthChallengeMfaEffect {
  SetMfaCode = 'authMfa/SetMfaCode',
}

export type AuthChallengeSetMfaCodeEffect = Effect<AuthChallengeMfaEffect.SetMfaCode, string>;

export type AuthChallengeMfaEffects = AuthChallengeSetMfaCodeEffect;

export type AuthChallengeSendMfaCodePayload = {
  email: string;
  session: string;
  challenge: string;
  mfaCode: string;
};
