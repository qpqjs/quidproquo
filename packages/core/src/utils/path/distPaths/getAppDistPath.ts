import path from 'path';

/** `dist/apps/<app>`: everything built for one app. */
export const getAppDistPath = (root: string, appName: string): string => path.join(root, 'dist', 'apps', appName);
