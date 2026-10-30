export type AuthChallengeSendMfaSetupCodePayload = {
  email: string;
  session: string;
  challenge: string;
  mfaCode: string;
};
