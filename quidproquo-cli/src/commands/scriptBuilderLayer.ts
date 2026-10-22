// `qpq script:builder-layer --app <app>` — produce the lambda layer that gives a
// service rspack, for services that registered defineUserScriptBuilder. The directory
// is the one getUserScriptBuilderApiLayer points at, so nothing is told a path. Run from
// the app's qpq:predeploy hook so every deploy ships a layer matching the lambda
// architecture.
import { qpqCoreUtils } from 'quidproquo-core';
import { getUserScriptBuilderLayerDir } from 'quidproquo-user-script';

import { getServiceNames } from '../lib/discovery';
import { loadServiceQpqConfig } from '../lib/qpqConfigs';
import { resolveAppSelection } from '../lib/resolveAppSelection';
import { resolveDeployment } from '../lib/resolveDeployment';
import { buildUserScriptBuilderLayer } from '../lib/userScriptBuilderLayer';

/* eslint-disable @typescript-eslint/no-require-imports */
// The rspack the CLI itself resolves is the one the dev server builds with; the layer
// pins the same version so a script builds identically on both runtimes.
const getRspackVersion = (): string => require('@rspack/core/package.json').version as string;

export const scriptBuilderLayerCommand = async (argv: string[]): Promise<void> => {
  const appName = await resolveAppSelection({ argv });
  // A service config only loads with a deployment's settings primed; under a parent
  // qpq command (the predeploy hook) DEPLOY_NAME already says which.
  await resolveDeployment(argv, appName);
  const [firstService] = getServiceNames(appName);
  if (!firstService) {
    console.error(`script:builder-layer: app [${appName}] has no services to read the lambda architecture from`);
    process.exit(1);
  }

  const { architecture } = qpqCoreUtils.getJavascriptRuntimeConfig(loadServiceQpqConfig(appName, firstService));
  const rspackVersion = getRspackVersion();
  const outDir = getUserScriptBuilderLayerDir();

  console.log(`script:builder-layer: installing @rspack/core@${rspackVersion} for linux ${architecture} into ${outDir}`);
  const nodeDir = buildUserScriptBuilderLayer({ outDir, architecture, rspackVersion });
  console.log(`script:builder-layer: wrote ${nodeDir}`);
};
