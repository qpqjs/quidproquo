import { Effect } from 'quidproquo-core';

export type AuthChallengeMfaSetupState = {
  // Base32 secret returned by AssociateSoftwareToken (seeds the authenticator).
  secretCode: string;
  // Refreshed session from AssociateSoftwareToken, used to complete the challenge.
  session: string;
  mfaCode: string;
};

export enum AuthChallengeMfaSetupEffect {
  SetMfaCode = 'authMfaSetup/SetMfaCode',
  SetAssociation = 'authMfaSetup/SetAssociation',
}

export type AuthChallengeMfaSetupSetMfaCodeEffect = Effect<AuthChallengeMfaSetupEffect.SetMfaCode, string>;
export type AuthChallengeMfaSetupSetAssociationEffect = Effect<AuthChallengeMfaSetupEffect.SetAssociation, { secretCode: string; session: string }>;

export type AuthChallengeMfaSetupEffects = AuthChallengeMfaSetupSetMfaCodeEffect | AuthChallengeMfaSetupSetAssociationEffect;

export type AuthChallengeAssociateSoftwareTokenPayload = {
  session: string;
};

export type AuthChallengeSendMfaSetupCodePayload = {
  email: string;
  session: string;
  challenge: string;
  mfaCode: string;
};
