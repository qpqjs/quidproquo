import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineSecuritySmoke } from './config/defineSecuritySmoke';
import {
  askRunAdminServicesRequireAuthTest,
  askRunRuntimeErrorTextLeakTest,
  askRunSourceMapNotServedTest,
  askRunTenantIsolationTest,
  askRunUnverifiedBearerNoExpiryTest,
  askRunUnverifiedBearerTest,
  askRunWebsiteBucketNotPublicTest,
  askRunWebsiteSecurityHeadersTest,
} from './probes';

/** Regression probes from the security audit, one per checklist item. Each calls the deployed surface the way an attacker would and asserts the platform refuses or stays quiet. */
export const securitySmokeSuite: SmokeSuite = {
  defineConfig: defineSecuritySmoke,
  tests: [
    {
      name: 'securityAdminServicesRequireAuth',
      askRun: askRunAdminServicesRequireAuthTest,
    },
    {
      name: 'securityRuntimeErrorTextLeak',
      askRun: askRunRuntimeErrorTextLeakTest,
    },
    { name: 'securityUnverifiedBearer', askRun: askRunUnverifiedBearerTest },
    {
      name: 'securityUnverifiedBearerNoExpiry',
      askRun: askRunUnverifiedBearerNoExpiryTest,
    },
    {
      name: 'securitySourceMapNotServed',
      askRun: askRunSourceMapNotServedTest,
      deployedOnly: true,
    },
    {
      name: 'securityWebsiteBucketNotPublic',
      askRun: askRunWebsiteBucketNotPublicTest,
      deployedOnly: true,
    },
    {
      name: 'securityWebsiteSecurityHeaders',
      askRun: askRunWebsiteSecurityHeadersTest,
      deployedOnly: true,
    },
    { name: 'securityTenantIsolation', askRun: askRunTenantIsolationTest },
  ],
};
