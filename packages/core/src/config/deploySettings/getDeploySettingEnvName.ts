import { DEPLOY_SETTING_ENV_PREFIX } from './DEPLOY_SETTING_ENV_PREFIX';

/** The env var that carries the deploy setting `key` (the key is used verbatim, no case conversion). */
export const getDeploySettingEnvName = (key: string): string => `${DEPLOY_SETTING_ENV_PREFIX}${key}`;
