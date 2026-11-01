import { QPQConfigSetting } from '@qpqjs/core';

import { AwsDomainProxyViewerProtocolPolicy } from './AwsDomainProxyViewerProtocolPolicy';

/** The viewer protocol policy declared for one domain proxy, keyed by the proxy's name. */
export type AwsDomainProxyViewerProtocolPolicyQPQConfigSetting = {
  domainProxyName: string;
  viewerProtocolPolicy: AwsDomainProxyViewerProtocolPolicy;
} & QPQConfigSetting;
