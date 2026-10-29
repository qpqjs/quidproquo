import { getServiceNamesWithSubdir } from './getServiceNamesWithSubdir';

/** The services with a backend (a service/ folder). */
export const getBackendServiceNames = (root: string, appName: string): string[] => getServiceNamesWithSubdir(root, appName, 'service');
