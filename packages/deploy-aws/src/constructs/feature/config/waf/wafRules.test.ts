import { defineBootstrapWaf, WafManagedRuleGroup, WafRuleOverrideAction } from '@qpqjs/config-aws';

import { describe, expect, it } from 'vitest';

import { buildWebAclRules } from './wafRules';

describe('buildWebAclRules', () => {
  it('attaches managed groups without rule action overrides by default', () => {
    const rules = buildWebAclRules(
      defineBootstrapWaf({
        managedRuleGroups: [WafManagedRuleGroup.common],
      }),
    );

    expect(rules).toHaveLength(1);
    expect(rules![0]!.statement).toEqual({
      managedRuleGroupStatement: {
        vendorName: 'AWS',
        name: 'AWSManagedRulesCommonRuleSet',
        ruleActionOverrides: undefined,
      },
    });
  });

  it('emits count overrides only for the configured group', () => {
    const rules = buildWebAclRules(
      defineBootstrapWaf({
        managedRuleGroups: [WafManagedRuleGroup.common, WafManagedRuleGroup.sqli],
        managedRuleOverrides: {
          [WafManagedRuleGroup.common]: [{ name: 'SizeRestrictions_BODY', action: WafRuleOverrideAction.count }],
        },
      }),
    );

    const [common, sqli] = rules;

    expect((common!.statement as any).managedRuleGroupStatement).toMatchObject({
      name: 'AWSManagedRulesCommonRuleSet',
      ruleActionOverrides: [{ name: 'SizeRestrictions_BODY', actionToUse: { count: {} } }],
    });
    expect((sqli!.statement as any).managedRuleGroupStatement).toMatchObject({
      name: 'AWSManagedRulesSQLiRuleSet',
      ruleActionOverrides: undefined,
    });
  });

  // Security regression: the per-IP rate rule is the only request rate limit the platform has (API Gateway
  // stages run on account defaults), so it must block, aggregate per IP and sit ahead of the managed groups.
  it('emits a blocking per-IP rate rule ahead of the managed groups', () => {
    const rules = buildWebAclRules(
      defineBootstrapWaf({
        rateLimits: [{ name: 'all-traffic', limit: 2000 }],
        managedRuleGroups: [WafManagedRuleGroup.common],
      }),
    );

    const [rateLimit, common] = rules;

    expect(rateLimit!.name).toBe('rate-limit-all-traffic');
    expect(rateLimit!.action).toEqual({ block: {} });
    expect((rateLimit!.statement as any).rateBasedStatement).toMatchObject({ limit: 2000, aggregateKeyType: 'IP' });
    expect(rateLimit!.priority).toBeLessThan(common!.priority);
  });
});
