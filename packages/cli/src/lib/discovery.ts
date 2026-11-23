import {
  getAppPath,
  getAppsPath,
  getAvailableAppNames,
  getBackendServiceNames,
  getServiceNamesWithViews as getServiceNamesWithViewsIn,
  getServicePath,
} from '@qpqjs/deploy-rspack';

// The consumer repo root, qpq always runs from the workspace root (npm
// scripts set cwd there). Discovery itself is deploy-rspack's; these bind it to that root.
export const getRoot = (): string => process.cwd();

export const getAppsDirectory = (): string => getAppsPath(getRoot());
export const getAppDirectory = (appName: string): string => getAppPath(getRoot(), appName);
export const getServiceDirectory = (appName: string, service: string): string => getServicePath(getRoot(), appName, service);

export const getAvailableApps = (): string[] => getAvailableAppNames(getRoot());

/** The app's backend services: the ones with an infrastructure entry. A service folder without one is skipped. */
export const getServiceNames = (appName: string): string[] => getBackendServiceNames(getRoot(), appName);

export const getServiceNamesWithViews = (appName: string): string[] => getServiceNamesWithViewsIn(getRoot(), appName);
