import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../../QPQConfig';
import { defineBootstrapWaf, WafManagedRuleGroup, WafRuleOverrideAction } from './defineBootstrapWaf';

describe('defineBootstrapWaf', () => {
  it('builds a waf setting with undefined options when omitted', () => {
    expect(defineBootstrapWaf()).toEqual({
      configSettingType: QPQAwsConfigSettingType.bootstrapWaf,
      uniqueKey: 'bootstrapWaf',
      managedRuleGroups: undefined,
      rateLimits: undefined,
      managedRuleOverrides: undefined,
    });
  });

  it('carries through the supplied options', () => {
    const managedRuleGroups = [WafManagedRuleGroup.common, WafManagedRuleGroup.ipReputation];
    const rateLimits = [{ name: 'auth', limit: 100, uriPathStartsWith: '/auth' }];
    const managedRuleOverrides = {
      [WafManagedRuleGroup.common]: [{ name: 'SizeRestrictions_BODY', action: WafRuleOverrideAction.count }],
    };

    expect(defineBootstrapWaf({ managedRuleGroups, rateLimits, managedRuleOverrides })).toEqual({
      configSettingType: QPQAwsConfigSettingType.bootstrapWaf,
      uniqueKey: 'bootstrapWaf',
      managedRuleGroups,
      rateLimits,
      managedRuleOverrides,
    });
  });
});
