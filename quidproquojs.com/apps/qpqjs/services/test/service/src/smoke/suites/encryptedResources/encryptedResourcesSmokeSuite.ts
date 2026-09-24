import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineEncryptedResourcesSmoke } from './config/defineEncryptedResourcesSmoke';
import { askRunEncryptedResourcesTest } from './logic/askRunEncryptedResourcesTest';

/** Round trips through a drive and a store encrypted with an owned crypto key. */
export const encryptedResourcesSmokeSuite: SmokeSuite = {
  defineConfig: defineEncryptedResourcesSmoke,
  tests: [{ name: 'encryptedResources', askRun: askRunEncryptedResourcesTest }],
};
