import { defineSigningKey, QPQConfig } from 'quidproquo';

import { SMOKE_PROBE_SIGNING_KEY } from '@qpqjs/constants';

/**
 * An owned RSA signing key: kms:Sign and kms:GetPublicKey through the
 * alias-conditioned grant. testa declares the same key foreign (see its
 * smoke/suites/signingKey) for the cross-service verify test.
 */
export const defineSigningKeySmoke = (): QPQConfig => [
  defineSigningKey(SMOKE_PROBE_SIGNING_KEY),
];
