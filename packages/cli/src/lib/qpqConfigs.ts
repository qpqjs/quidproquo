import { type QPQConfig, qpqCoreUtils } from '@qpqjs/core';
import { getWorkspaceServiceQpqConfig } from '@qpqjs/deploy-aws';

import { getRoot, getServiceNames } from './discovery';

// Loads a service's live infrastructure.ts (qpq runs with ts-node hooks
// registered, so requiring TS works and `@scope/*` imports resolve through
// workspace symlinks).
export const loadServiceQpqConfig = (appName: string, service: string): QPQConfig => getWorkspaceServiceQpqConfig(getRoot(), appName, service);

// App-wide facts (the application name, the domain stack) live on every service's config alike, so the first
// service found stands in for the app. An app with no services has no config to read and that is an error.
export const loadFirstServiceQpqConfig = (appName: string): QPQConfig => {
  const [firstService] = getServiceNames(appName);
  if (firstService === undefined) {
    throw new Error(`No services found for app ${appName}`);
  }

  return loadServiceQpqConfig(appName, firstService);
};

export const getAppPrefix = (appName: string): string => qpqCoreUtils.getApplicationName(loadFirstServiceQpqConfig(appName));

// The subset of the given services that opt into module-federation publishing,
// i.e. declare defineFederatedModuleStore(...). Federation is a config setting,
// not a directory convention (unlike views/ backends), so detecting it means
// loading each service's config, which is why this lives here and not in the
// directory-only discovery module. Used by the deploy drivers to decide which
// backends to publish federated remotes for after a deploy.
export const getServiceNamesWithFederation = (appName: string, serviceNames: string[]): string[] =>
  serviceNames.filter((service) => !!qpqCoreUtils.getFederatedModuleStore(loadServiceQpqConfig(appName, service)));
