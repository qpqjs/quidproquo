import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../QPQConfig';
import { defineDomainCertificate } from './domainCertificate';

describe('defineDomainCertificate', () => {
  it('builds a certificate setting keyed by region, defaulting includeApex to false', () => {
    expect(defineDomainCertificate('us-east-1', [{ subdomain: 'api' }])).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsDomainCertificate,
      uniqueKey: 'us-east-1',
      region: 'us-east-1',
      targets: [{ subdomain: 'api' }],
      includeApex: false,
    });
  });

  it('uses the supplied includeApex option', () => {
    expect(defineDomainCertificate('us-east-1', [], { includeApex: true }).includeApex).toBe(true);
  });
});
