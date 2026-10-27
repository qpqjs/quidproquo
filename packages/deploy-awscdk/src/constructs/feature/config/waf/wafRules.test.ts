import { QPQAwsConfigSettingType, WafManagedRuleGroup, WafRuleOverrideAction } from 'quidproquo-config-aws';

import { describe, expect, it } from 'vitest';

import { buildWebAclRules } from './wafRules';

const wafConfigBase = {
  configSettingType: QPQAwsConfigSettingType.bootstrapWaf,
  uniqueKey: 'bootstrapWaf',
};

describe('buildWebAclRules', () => {
  it('attaches managed groups without rule action overrides by default', () => {
    const rules = buildWebAclRules({
      ...wafConfigBase,
      managedRuleGroups: [WafManagedRuleGroup.common],
    });

    expect(rules).toHaveLength(1);
    expect(rules[0].statement).toEqual({
      managedRuleGroupStatement: {
        vendorName: 'AWS',
        name: 'AWSManagedRulesCommonRuleSet',
        ruleActionOverrides: undefined,
      },
    });
  });

  it('emits count overrides only for the configured group', () => {
    const rules = buildWebAclRules({
      ...wafConfigBase,
      managedRuleGroups: [WafManagedRuleGroup.common, WafManagedRuleGroup.sqli],
      managedRuleOverrides: {
        [WafManagedRuleGroup.common]: [{ name: 'SizeRestrictions_BODY', action: WafRuleOverrideAction.count }],
      },
    });

    const [common, sqli] = rules;

    expect(common.statement.managedRuleGroupStatement).toMatchObject({
      name: 'AWSManagedRulesCommonRuleSet',
      ruleActionOverrides: [{ name: 'SizeRestrictions_BODY', actionToUse: { count: {} } }],
    });
    expect(sqli.statement.managedRuleGroupStatement).toMatchObject({
      name: 'AWSManagedRulesSQLiRuleSet',
      ruleActionOverrides: undefined,
    });
  });
});
