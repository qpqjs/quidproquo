import { ApiLayer } from '@qpqjs/config-aws';

import { getUserScriptBuilderLayerDir } from './getUserScriptBuilderLayerDir';
import { USER_SCRIPT_BUILDER_LAYER_MODULES } from './USER_SCRIPT_BUILDER_LAYER_MODULES';
import { USER_SCRIPT_BUILDER_LAYER_NAME } from './USER_SCRIPT_BUILDER_LAYER_NAME';

/**
 * The api layer entry that gives a service's lambdas rspack, for the service that
 * registered defineUserScriptBuilder. Points at the directory `qpq script:builder-layer`
 * produces, so the app's predeploy hook must run that command before a deploy.
 */
export const getUserScriptBuilderApiLayer = (): ApiLayer => ({
  name: USER_SCRIPT_BUILDER_LAYER_NAME,
  buildPath: getUserScriptBuilderLayerDir(),
  modules: [...USER_SCRIPT_BUILDER_LAYER_MODULES],
});
