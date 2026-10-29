import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getAwsDomainProxyViewerProtocolPolicy } from '../../utils/configUtils';
import { QPQAwsConfigSettingType } from '../QPQConfig';
import { AwsDomainProxyViewerProtocolPolicy, defineAwsDomainProxyViewerProtocolPolicy } from './awsDomainProxyViewerProtocolPolicy';

describe('defineAwsDomainProxyViewerProtocolPolicy', () => {
  it('keys the policy to the domain proxy', () => {
    expect(defineAwsDomainProxyViewerProtocolPolicy('site', AwsDomainProxyViewerProtocolPolicy.allowAll)).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsDomainProxyViewerProtocolPolicy,
      uniqueKey: 'awsDomainProxyViewerProtocolPolicy-site',
      domainProxyName: 'site',
      viewerProtocolPolicy: AwsDomainProxyViewerProtocolPolicy.allowAll,
    });
  });

  it('resolves to the declared policy for that proxy, else redirect-to-https', () => {
    const qpqConfig = buildTestQpqConfig([defineAwsDomainProxyViewerProtocolPolicy('site', AwsDomainProxyViewerProtocolPolicy.httpsOnly)]);

    expect(getAwsDomainProxyViewerProtocolPolicy('site', qpqConfig)).toBe(AwsDomainProxyViewerProtocolPolicy.httpsOnly);
    expect(getAwsDomainProxyViewerProtocolPolicy('other', qpqConfig)).toBe(AwsDomainProxyViewerProtocolPolicy.redirectToHttps);
  });
});
