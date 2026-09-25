import path from 'path';

export const getQpqAppDeployConfigPath = (root: string, appName: string): string => path.join(root, 'apps', appName, 'deploy.config.json');
