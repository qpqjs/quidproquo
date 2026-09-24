import {
  askCryptoGetPublicKey,
  askCryptoSignJwt,
  askGetCurrentEpoch,
  AskResponse,
  askServiceFunctionExecute,
} from 'quidproquo';

import {
  QpqjsServiceEnum,
  SMOKE_CROSS_SERVICE_SIGNING_KEY_PROBE_FUNCTION_NAME,
  SMOKE_PROBE_SIGNING_KEY,
} from '@qpqjs/constants';
import { SmokeSigningKeyClaims } from '@qpqjs/test-models';
import {
  CrossServiceSigningKeyProbePayload,
  CrossServiceSigningKeyProbeResult,
} from '@qpqjs/testa-models';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

// The issuer/verifier split a signing key exists for: THIS service signs a
// jwt with its owned key, testa verifies it through its foreign declaration
// (owner: test) of the same key. An error from inside testa is its
// kms:GetPublicKey grant or the cross-module alias resolution; a valid result
// with our runId proves both services resolved the same physical key, which
// the public key comparison then confirms directly. testa also tries to sign
// with the key: a foreign declaration holds no kms:Sign, so that must fail.
export function* askRunCrossServiceSigningKeyTest(
  runId: string
): AskResponse<void> {
  const now = yield* askGetCurrentEpoch();
  const claims: SmokeSigningKeyClaims = { runId, exp: now + 60 };
  const token = yield* askCryptoSignJwt(SMOKE_PROBE_SIGNING_KEY, claims);

  const result = yield* askServiceFunctionExecute<
    CrossServiceSigningKeyProbeResult,
    CrossServiceSigningKeyProbePayload
  >(
    QpqjsServiceEnum.TestA,
    SMOKE_CROSS_SERVICE_SIGNING_KEY_PROBE_FUNCTION_NAME,
    { token }
  );

  yield* askSmokeAssert(
    result.runId === runId,
    `testa did not verify our jwt (${result.runId ?? 'invalid'})`
  );

  const publicKeyPem = yield* askCryptoGetPublicKey(SMOKE_PROBE_SIGNING_KEY);
  yield* askSmokeAssert(
    result.publicKeyPem === publicKeyPem,
    'testa resolved a different public key than the owning service'
  );

  yield* askSmokeAssert(
    !result.couldSign,
    'testa was able to sign with a key it does not own'
  );
}
