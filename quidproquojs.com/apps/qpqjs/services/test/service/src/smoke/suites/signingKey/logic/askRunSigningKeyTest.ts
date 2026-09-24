import {
  askCryptoGetPublicKey,
  askCryptoSign,
  askCryptoSignJwt,
  askCryptoVerify,
  askCryptoVerifyJwt,
  askGetCurrentEpoch,
  AskResponse,
} from 'quidproquo';

import { SMOKE_PROBE_SIGNING_KEY } from '@qpqjs/constants';
import { SmokeSigningKeyClaims } from '@qpqjs/test-models';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

const PUBLIC_KEY_PEM_HEADER = '-----BEGIN PUBLIC KEY-----';

// Every signing-key action against the owned key: kms:Sign (askCryptoSign /
// askCryptoSignJwt) and kms:GetPublicKey (askCryptoGetPublicKey, and the
// in-process askCryptoVerify behind askCryptoVerifyJwt). Then the two ways a
// token must fail - a flipped signature byte and a past exp - so a verifier
// that accepts everything cannot pass.
export function* askRunSigningKeyTest(runId: string): AskResponse<void> {
  const publicKeyPem = yield* askCryptoGetPublicKey(SMOKE_PROBE_SIGNING_KEY);
  yield* askSmokeAssert(
    publicKeyPem.startsWith(PUBLIC_KEY_PEM_HEADER),
    'GetPublicKey did not return an SPKI PEM'
  );

  const message = `smoke probe ${runId}`;
  const signature = yield* askCryptoSign(SMOKE_PROBE_SIGNING_KEY, message);
  yield* askSmokeAssert(
    signature.length > 0,
    'Sign returned an empty signature'
  );

  const verified = yield* askCryptoVerify(
    SMOKE_PROBE_SIGNING_KEY,
    message,
    signature
  );
  yield* askSmokeAssert(verified, 'raw signature did not verify');

  const now = yield* askGetCurrentEpoch();

  const claims: SmokeSigningKeyClaims = { runId, exp: now + 60 };
  const token = yield* askCryptoSignJwt(SMOKE_PROBE_SIGNING_KEY, claims);

  const result = yield* askCryptoVerifyJwt<SmokeSigningKeyClaims>(
    SMOKE_PROBE_SIGNING_KEY,
    token
  );
  yield* askSmokeAssert(
    result.valid && result.claims.runId === runId,
    'signed jwt did not verify with its own claims'
  );

  // Corrupt a character in the MIDDLE of the signature segment. Not the last
  // one: a 2048-bit signature is 342 base64url chars and the final char
  // carries only two real bits, so flipping it can leave the decoded bytes
  // unchanged and the token still valid.
  const [header, payload, signatureSegment] = token.split('.');
  const middle = Math.floor(signatureSegment.length / 2);
  const flipped = signatureSegment[middle] === 'A' ? 'B' : 'A';
  const tamperedToken = `${header}.${payload}.${signatureSegment.slice(0, middle)}${flipped}${signatureSegment.slice(middle + 1)}`;
  const tampered = yield* askCryptoVerifyJwt<SmokeSigningKeyClaims>(
    SMOKE_PROBE_SIGNING_KEY,
    tamperedToken
  );
  yield* askSmokeAssert(
    !tampered.valid && tampered.reason === 'bad-signature',
    'tampered jwt was not rejected as bad-signature'
  );

  const expiredToken = yield* askCryptoSignJwt(SMOKE_PROBE_SIGNING_KEY, {
    runId,
    exp: now - 60,
  });
  const expired = yield* askCryptoVerifyJwt<SmokeSigningKeyClaims>(
    SMOKE_PROBE_SIGNING_KEY,
    expiredToken
  );
  yield* askSmokeAssert(
    !expired.valid && expired.reason === 'expired',
    'expired jwt was not rejected as expired'
  );
}
