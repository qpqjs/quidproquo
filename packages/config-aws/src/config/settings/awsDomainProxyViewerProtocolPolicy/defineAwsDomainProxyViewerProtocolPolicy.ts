import { QPQAwsConfigSettingType } from '../../QPQConfig';
import { AwsDomainProxyViewerProtocolPolicy, AwsDomainProxyViewerProtocolPolicyQPQConfigSetting } from './types';

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
