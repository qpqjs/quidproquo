import {
  askCatch,
  askCryptoGetPublicKey,
  askCryptoSign,
  askCryptoVerifyJwt,
  AskResponse,
} from 'quidproquo';

import { SMOKE_PROBE_SIGNING_KEY } from '@qpqjs/constants';
import { SmokeSigningKeyClaims } from '@qpqjs/test-models';
import { CrossServiceSigningKeyProbeResult } from '@qpqjs/testa-models';

// Verifies a jwt the test service signed, under THIS service's role and
// through its foreign (owner: test) declaration of the key: kms:GetPublicKey
// on the owner's alias, then an in-process RS256 check. Then tries to sign
// with the same key, which the foreign declaration must NOT be granted.
export function* askProbeForeignSigningKey(
  token: string
): AskResponse<CrossServiceSigningKeyProbeResult> {
  const result = yield* askCryptoVerifyJwt<SmokeSigningKeyClaims>(
    SMOKE_PROBE_SIGNING_KEY,
    token
  );

  const publicKeyPem = yield* askCryptoGetPublicKey(SMOKE_PROBE_SIGNING_KEY);

  const signAttempt = yield* askCatch(
    askCryptoSign(SMOKE_PROBE_SIGNING_KEY, 'must-be-denied')
  );

  return {
    runId: result.valid ? result.claims.runId : null,
    publicKeyPem,
    couldSign: signAttempt.success,
  };
}
