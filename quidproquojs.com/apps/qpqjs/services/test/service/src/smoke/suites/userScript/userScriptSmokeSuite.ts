import { defineUserScriptModule } from 'quidproquo';

import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { SMOKE_PROBE_USER_SCRIPT_MODULE } from './constants/SMOKE_PROBE_USER_SCRIPT_MODULE';
import { askRunUserScriptAwsLockdownTest } from './logic/askRunUserScriptAwsLockdownTest';
import { askRunUserScriptBuildErrorTest } from './logic/askRunUserScriptBuildErrorTest';
import { askRunUserScriptErrorTest } from './logic/askRunUserScriptErrorTest';
import { askRunUserScriptSurvivorTest } from './logic/askRunUserScriptSurvivorTest';
import { askRunUserScriptTest } from './logic/askRunUserScriptTest';
import { askRunUserScriptZipTest } from './logic/askRunUserScriptZipTest';

/** A user script built on the platform from sources on the probe drive, loose or zipped, into one file, then called by export name inside the service's sandbox. The drive belongs to the harness and the builder and runner are registered on the service; the suite's own config is the probe module the lockdown test's script imports. */
export const userScriptSmokeSuite: SmokeSuite = {
  defineConfig: () => [defineUserScriptModule(SMOKE_PROBE_USER_SCRIPT_MODULE, '/smoke/suites/userScript/probe/scriptModules::smokeProbeModule')],
  tests: [
    { name: 'userScript', askRun: askRunUserScriptTest },
    { name: 'userScriptNotFound', askRun: askRunUserScriptErrorTest },
    { name: 'userScriptBuildNotFound', askRun: askRunUserScriptBuildErrorTest },
    { name: 'userScriptZip', askRun: askRunUserScriptZipTest },
    { name: 'userScriptSurvivor', askRun: askRunUserScriptSurvivorTest },
    {
      name: 'userScriptAwsLockdown',
      askRun: askRunUserScriptAwsLockdownTest,
      deployedOnly: true,
    },
  ],
};
