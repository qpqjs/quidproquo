import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineSecretSmoke } from './config/defineSecretSmoke';
import { askRunSecretTest } from './logic/askRunSecretTest';

/** Reads an owned secret. */
export const secretSmokeSuite: SmokeSuite = {
  defineConfig: defineSecretSmoke,
  tests: [{ name: 'secret', askRun: askRunSecretTest }],
};
