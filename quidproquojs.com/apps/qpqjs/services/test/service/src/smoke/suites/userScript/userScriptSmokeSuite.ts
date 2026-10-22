import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { askRunUserScriptErrorTest } from './logic/askRunUserScriptErrorTest';
import { askRunUserScriptTest } from './logic/askRunUserScriptTest';

/** A built user script on the probe drive: exports callable by name, its story actions reaching the real processors. No config: the drive belongs to the harness; the script comes from the service build step. */
export const userScriptSmokeSuite: SmokeSuite = {
  tests: [
    { name: 'userScript', askRun: askRunUserScriptTest },
    { name: 'userScriptNotFound', askRun: askRunUserScriptErrorTest },
  ],
};
