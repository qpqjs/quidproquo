import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { askRunUserScriptBuildErrorTest } from './logic/askRunUserScriptBuildErrorTest';
import { askRunUserScriptErrorTest } from './logic/askRunUserScriptErrorTest';
import { askRunUserScriptTest } from './logic/askRunUserScriptTest';

/** A user script built on the platform from sources on the probe drive, then called by export name. No config of its own: the drive belongs to the harness and the builder is registered on the service. */
export const userScriptSmokeSuite: SmokeSuite = {
  tests: [
    { name: 'userScript', askRun: askRunUserScriptTest },
    { name: 'userScriptNotFound', askRun: askRunUserScriptErrorTest },
    { name: 'userScriptBuildNotFound', askRun: askRunUserScriptBuildErrorTest },
  ],
};
