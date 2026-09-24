import { defineSecret, QPQConfig } from 'quidproquo';

import { SMOKE_PROBE_SECRET } from '../constants/SMOKE_PROBE_SECRET';

/** An owned secret for the secret test to read. */
export const defineSecretSmoke = (): QPQConfig => [
  defineSecret(SMOKE_PROBE_SECRET),
];
