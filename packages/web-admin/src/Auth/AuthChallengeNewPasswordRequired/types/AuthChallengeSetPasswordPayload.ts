export type AuthChallengeSetPasswordPayload = {
  email: string;
  session: string;
  challenge: string;
  newPassword: string;
};
