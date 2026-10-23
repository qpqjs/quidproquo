import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { askRunUserScriptBuildErrorTest } from './logic/askRunUserScriptBuildErrorTest';
import { askRunUserScriptErrorTest } from './logic/askRunUserScriptErrorTest';
import { askRunUserScriptTest } from './logic/askRunUserScriptTest';
import { askRunUserScriptZipTest } from './logic/askRunUserScriptZipTest';

/** A user script built on the platform from sources on the probe drive, loose or zipped, then called by export name. No config of its own: the drive belongs to the harness and the builder is registered on the service. */
export const userScriptSmokeSuite: SmokeSuite = {
  tests: [
    { name: 'userScript', askRun: askRunUserScriptTest },
    { name: 'userScriptNotFound', askRun: askRunUserScriptErrorTest },
    { name: 'userScriptBuildNotFound', askRun: askRunUserScriptBuildErrorTest },
    { name: 'userScriptZip', askRun: askRunUserScriptZipTest },
  ],
};
