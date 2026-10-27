import { getDeploySettingEnvName } from './getDeploySettingEnvName';

/** A deploy setting from the selected deployment, or `fallback` when the deployment does not define it. */
export const getDeploySettingOrDefault = (key: string, fallback: string): string => process.env[getDeploySettingEnvName(key)] ?? fallback;
