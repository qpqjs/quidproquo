import { Nullable } from 'quidproquo';

// What testa made of the token through its foreign declaration of the test
// service's signing key: the runId claim when the jwt verified (null when it
// did not), the public key it resolved so the caller can compare it with its
// own, and whether it was ALLOWED to sign with the key - it must not be.
export type CrossServiceSigningKeyProbeResult = {
  runId: Nullable<string>;
  publicKeyPem: string;
  couldSign: boolean;
};
