import { getDeploySetting } from './getDeploySetting';

/** A comma-separated deploy setting as a trimmed list, empty items dropped. Throws like `getDeploySetting` when unset. */
export const getDeploySettingList = (key: string): string[] =>
  getDeploySetting(key)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
