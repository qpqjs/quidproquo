import { QPQConfigAdvancedSettings, QPQConfigSetting } from '@qpqjs/core';

import { ApiLayer, ServiceAccountInfo } from '../../types';
import { QPQAwsConfigSettingType } from '../QPQConfig';

export type QPQConfigAdvancedAwsServiceAccountInfoSettings = {
  apiLayers?: ApiLayer[];
  lambdaMaxMemoryInMiB?: number;

  // How long CloudWatch keeps function and API access logs. Rounded up to the
  // nearest retention CloudWatch supports. Default: a week.
  cloudWatchLogRetentionDays?: number;

  logServiceName?: string;

  disableLogs?: boolean;
  disableLambdaWarming?: boolean;
  disableReservedConcurrency?: boolean;
  disableTracing?: boolean;
  instantLogs?: boolean;
} & QPQConfigAdvancedSettings;

export type AwsServiceAccountInfoQPQConfigSetting = {
  deployAccountId: string;
  deployRegion: string;

  logServiceName?: string;

  serviceInfoMap: ServiceAccountInfo[];
  apiLayers: ApiLayer[];

  lambdaMaxMemoryInMiB: number;
  cloudWatchLogRetentionDays: number;

  disableLogs: boolean;
  disableLambdaWarming: boolean;
  disableReservedConcurrency: boolean;
  disableTracing: boolean;
  instantLogs: boolean;
} & QPQConfigSetting;

export const defineAwsServiceAccountInfo = (
  deployAccountId: string,
  deployRegion: string,

  serviceInfoMap?: ServiceAccountInfo[],
  options?: QPQConfigAdvancedAwsServiceAccountInfoSettings,
): AwsServiceAccountInfoQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.awsServiceAccountInfo,
  uniqueKey: 'AwsServiceAccountInfo',

  deployAccountId,
  deployRegion,

  serviceInfoMap: serviceInfoMap ?? [],
  apiLayers: options?.apiLayers ?? [],

  // Zero is not a valid memory size or retention period, so it means unset here, hence || rather than ??.
  lambdaMaxMemoryInMiB: options?.lambdaMaxMemoryInMiB || 1024,
  cloudWatchLogRetentionDays: options?.cloudWatchLogRetentionDays || 7,

  logServiceName: options?.logServiceName,

  disableLogs: !!options?.disableLogs,
  disableLambdaWarming: !!options?.disableLambdaWarming,
  disableReservedConcurrency: !!options?.disableReservedConcurrency,
  disableTracing: !!options?.disableTracing,
  instantLogs: !!options?.instantLogs,
});
