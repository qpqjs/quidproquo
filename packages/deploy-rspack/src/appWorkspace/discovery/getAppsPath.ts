import path from 'path';

/** `apps/`, where every app of the workspace lives. */
export const getAppsPath = (root: string): string => path.join(root, 'apps');
