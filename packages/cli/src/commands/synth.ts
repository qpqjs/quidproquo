// `qpq synth [service]`, synthesizes each backend service's QPQ config to
// dist/apps/<app>/infrastructure/<module>-config.json.
//
// Runs with ts-node hooks registered (see runCli), which transpiles each
// service's infrastructure.ts on require. Cross-package `@scope/*` imports
// resolve through the workspace node_modules symlinks to already-built dist.
import { qpqCoreUtils, QpqDeployEnvVar } from '@qpqjs/core';

import fs from 'fs';
import path from 'path';

import { getPositionalArgs } from '../lib/args';
import { getAvailableApps, getRoot, getServiceNamesWithSubdir } from '../lib/discovery';
import { loadServiceQpqConfig } from '../lib/qpqConfigs';
import { getRequestedAppName, resolveAppSelection } from '../lib/resolveAppSelection';
import { resolveDeployment } from '../lib/resolveDeployment';

const processConfig = (folderName: string, appName: string): void => {
  console.log(`Processing infrastructure: [${folderName}] for app [${appName}]`);
  const qpqConfig = loadServiceQpqConfig(appName, folderName);
  const moduleName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  const directoryPath = path.join(getRoot(), 'dist', 'apps', appName, 'infrastructure');
  fs.mkdirSync(directoryPath, { recursive: true });
  fs.writeFileSync(path.join(directoryPath, `${moduleName}-config.json`), JSON.stringify(qpqConfig, null, 2));
  console.log(`  -> ${appName}/infrastructure/${moduleName}-config.json`);
};

export const synthCommand = async (argv: string[]): Promise<void> => {
  const [specifiedServiceName] = getPositionalArgs(argv, ['--app', '--deployment']);

  let appNames: string[];
  if (specifiedServiceName && !getRequestedAppName(argv, QpqDeployEnvVar.deployAppName)) {
    // A bare service name is unambiguous, synth it in whichever app owns it.
    const appWithService = getAvailableApps().find((appName) => getServiceNamesWithSubdir(appName, 'service').includes(specifiedServiceName));
    if (!appWithService) {
      console.error(`Service '${specifiedServiceName}' not found in any app`);
      process.exit(1);
    }
    appNames = [appWithService];
  } else {
    const selection = await resolveAppSelection({ argv, envVar: QpqDeployEnvVar.deployAppName, allowAll: true });
    appNames = selection === 'all' ? getAvailableApps() : [selection];
  }

  console.log(`QPQ synthesizing apps: ${appNames.join(', ')}`);

  for (const appName of appNames) {
    // Service configs read the deployment env vars at require time, so the
    // deployment is resolved (and primed) before any infrastructure.ts loads.
    await resolveDeployment(argv, appName);

    // Validate a specified service against the app's discovered services before it
    // reaches loadServiceQpqConfig -> require, exactly as the bare-service-name branch
    // above does: an unchecked typo hits a cryptic module-resolution error and a `../`
    // value normalizes into an arbitrary require target.
    const appServices = getServiceNamesWithSubdir(appName, 'service');
    if (specifiedServiceName && !appServices.includes(specifiedServiceName)) {
      console.error(`Service '${specifiedServiceName}' not found in app '${appName}'`);
      process.exitCode = 1;
      continue;
    }

    const serviceNames = specifiedServiceName ? [specifiedServiceName] : appServices;

    for (const folderName of serviceNames) {
      try {
        processConfig(folderName, appName);
      } catch (error) {
        console.error(`Failed to process ${folderName} in ${appName}:`, error);
        process.exitCode = 1;
      }
    }
  }
};
