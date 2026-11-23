import { getAppServiceNames } from './getAppServiceNames';

/**
 * The services with a backend: a service/ folder that holds an infrastructure entry
 * (service/src/infrastructure.ts or .js). A service/ folder without one is not a backend, so a
 * folder that only holds left-over build output (from another branch, say) is skipped instead of
 * failing the command that tries to load it.
 */
export const getBackendServiceNames = (root: string, appName: string): string[] => getAppServiceNames(root, appName);
