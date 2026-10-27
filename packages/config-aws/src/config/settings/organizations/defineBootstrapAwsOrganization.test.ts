import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../../QPQConfig';
import { defineBootstrapAwsOrganization } from './defineBootstrapAwsOrganization';

describe('defineBootstrapAwsOrganization', () => {
  it('builds an organization setting keyed by the root ou id and name', () => {
    expect(defineBootstrapAwsOrganization('ou-root', 'aws@example.com', 'acme', ['dev', 'prod'])).toEqual({
      configSettingType: QPQAwsConfigSettingType.bootstrapAwsOrganization,
      uniqueKey: 'ou-root-acme',
      rootAwsOrganizationalUnitId: 'ou-root',
      organizationName: 'acme',
      accountNames: ['dev', 'prod'],
      baseEmailAddress: 'aws@example.com',
    });
  });
});
