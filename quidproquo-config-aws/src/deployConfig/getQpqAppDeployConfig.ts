import { QpqAppDeployConfig } from 'quidproquo-core';

import fs from 'fs';

import { getQpqAppDeployConfigPath } from './getQpqAppDeployConfigPath';
import { validateQpqAppDeployConfig } from './validateQpqAppDeployConfig';

/** Loads and validates apps/<app>/deploy.config.json; throws when it is missing or malformed. */
export const getQpqAppDeployConfig = (root: string, appName: string): QpqAppDeployConfig => {
  const configPath = getQpqAppDeployConfigPath(root, appName);
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Missing ${configPath} - create it with { "deployments": { "<name>": { "platform": "aws", "name": "...", "environment": "...", "platformSettings": { "accountId": "...", "region": "..." } } } }`,
    );
  }

  return validateQpqAppDeployConfig(JSON.parse(fs.readFileSync(configPath, 'utf8')), configPath);
};
