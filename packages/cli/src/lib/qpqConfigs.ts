import { type QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { getWorkspaceServiceQpqConfig } from 'quidproquo-deploy-awscdk';

import { getRoot, getServiceNames } from './discovery';

// Loads a service's live infrastructure.ts (qpq runs with ts-node hooks
// registered, so requiring TS works and `@scope/*` imports resolve through
// workspace symlinks).
export const loadServiceQpqConfig = (appName: string, service: string): QPQConfig => getWorkspaceServiceQpqConfig(getRoot(), appName, service);

export const getAppPrefix = (appName: string): string => {
  const services = getServiceNames(appName);
  if (services.length === 0) throw new Error(`No services found for app ${appName}`);
  return qpqCoreUtils.getApplicationName(loadServiceQpqConfig(appName, services[0]));
};

// The subset of the given services that opt into module-federation publishing,
// i.e. declare defineFederatedModuleStore(...). Federation is a config setting,
// not a directory convention (unlike views/ backends), so detecting it means
// loading each service's config — which is why this lives here and not in the
// directory-only discovery module. Used by the deploy drivers to decide which
// backends to publish federated remotes for after a deploy.
export const getServiceNamesWithFederation = (appName: string, serviceNames: string[]): string[] =>
  serviceNames.filter((service) => !!qpqCoreUtils.getFederatedModuleStore(loadServiceQpqConfig(appName, service)));
