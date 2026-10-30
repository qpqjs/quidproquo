import { QPQConfigSetting } from '@qpqjs/core';

import { QPQAwsConfigSettingType } from '../QPQConfig';

/** CloudFront's viewer protocol policies, for a domain proxy's distribution. */
export enum AwsDomainProxyViewerProtocolPolicy {
  httpsOnly = 'https-only',
  redirectToHttps = 'redirect-to-https',
  allowAll = 'allow-all',
}

export type AwsDomainProxyViewerProtocolPolicyQPQConfigSetting = {
  domainProxyName: string;
  viewerProtocolPolicy: AwsDomainProxyViewerProtocolPolicy;
} & QPQConfigSetting;

/**
 * How the domain proxy named `domainProxyName` (defineDomainProxy) treats plain http viewers on
 * AWS. Without this setting http is redirected to https. A CloudFront concern, so it is keyed to
 * the proxy here rather than carried on the platform-neutral setting.
 */
export const defineAwsDomainProxyViewerProtocolPolicy = (
  domainProxyName: string,
  viewerProtocolPolicy: AwsDomainProxyViewerProtocolPolicy,
): AwsDomainProxyViewerProtocolPolicyQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.awsDomainProxyViewerProtocolPolicy,
  uniqueKey: `awsDomainProxyViewerProtocolPolicy-${domainProxyName}`,

  domainProxyName,
  viewerProtocolPolicy,
});
