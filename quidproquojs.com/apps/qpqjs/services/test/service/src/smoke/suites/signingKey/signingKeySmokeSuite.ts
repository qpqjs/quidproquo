import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineSigningKeySmoke } from './config/defineSigningKeySmoke';
import { askRunCrossServiceSigningKeyTest } from './logic/askRunCrossServiceSigningKeyTest';
import { askRunSigningKeyTest } from './logic/askRunSigningKeyTest';

/** An owned signing key, and testa verifying (but never signing) with it. */
export const signingKeySmokeSuite: SmokeSuite = {
  defineConfig: defineSigningKeySmoke,
  tests: [
    { name: 'signingKey', askRun: askRunSigningKeyTest },
    {
      name: 'crossServiceSigningKey',
      askRun: askRunCrossServiceSigningKeyTest,
    },
  ],
};
