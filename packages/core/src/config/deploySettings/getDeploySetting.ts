import { getDeploySettingEnvName } from './getDeploySettingEnvName';

/**
 * A deploy setting from the selected deployment's `settings` in deploy.config.json,
 * for use in infrastructure.ts and config helpers. Throws when the setting is not
 * defined, so a typo can't deploy an empty value.
 */
export const getDeploySetting = (key: string): string => {
  const value = process.env[getDeploySettingEnvName(key)];

  if (value === undefined) {
    throw new Error(`Deploy setting '${key}' is not defined. Add it to the deployment's "settings" in deploy.config.json.`);
  }

  return value;
};
