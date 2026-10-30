export type AuthChallengeSendMfaCodePayload = {
  email: string;
  session: string;
  challenge: string;
  mfaCode: string;
};
