// Input to testa's smokeCrossServiceSigningKeyProbe service function: a jwt
// the test service signed with its owned signing key.
export type CrossServiceSigningKeyProbePayload = {
  token: string;
};
