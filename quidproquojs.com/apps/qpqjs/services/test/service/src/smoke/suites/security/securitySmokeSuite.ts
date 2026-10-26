import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineSecuritySmoke } from './config/defineSecuritySmoke';
import { askRunAdminServicesRequireAuthTest } from './probes/askRunAdminServicesRequireAuthTest';
import { askRunRuntimeErrorTextLeakTest } from './probes/askRunRuntimeErrorTextLeakTest';
import { askRunSourceMapNotServedTest } from './probes/askRunSourceMapNotServedTest';
import { askRunUnverifiedBearerNoExpiryTest } from './probes/askRunUnverifiedBearerNoExpiryTest';
import { askRunUnverifiedBearerTest } from './probes/askRunUnverifiedBearerTest';

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
  ],
};
