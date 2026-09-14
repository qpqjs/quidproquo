// The claims the signing-key smoke tests mint. `runId` ties a token to the run
// that minted it; `exp` is a JWT NumericDate the verifier checks against QPQ time.
export type SmokeSigningKeyClaims = {
  runId: string;
  exp: number;
};
