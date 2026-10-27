import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../../QPQConfig';

export enum WafManagedRuleGroup {
  common = 'common', // AWSManagedRulesCommonRuleSet
  knownBadInputs = 'knownBadInputs', // AWSManagedRulesKnownBadInputsRuleSet
  sqli = 'sqli', // AWSManagedRulesSQLiRuleSet
  ipReputation = 'ipReputation', // AWSManagedRulesAmazonIpReputationList
}

export enum WafRuleOverrideAction {
  /** Observe and emit metrics for matching requests, but never block them. */
  count = 'count',
}

export interface WafManagedRuleOverride {
  /** Rule name inside the managed group, e.g. 'SizeRestrictions_BODY'. */
  name: string;

  /** Action to force for this rule instead of the group's default. */
  action: WafRuleOverrideAction;
}

export interface WafRateLimit {
  name: string;

  /** Maximum requests per 5-minute window per source IP before the IP is blocked. */
  limit: number;

  /** Scope the rate limit to uri paths with this prefix (e.g. '/auth'). Omit to rate limit all paths. */
  uriPathStartsWith?: string;
}

export interface BootstrapWafQPQConfigSetting extends QPQConfigSetting {
  /** Managed rule groups to enable. Defaults to common, knownBadInputs and sqli. */
  managedRuleGroups?: WafManagedRuleGroup[];

  /** Rate-based blocking rules (e.g. brute-force throttling on auth endpoints). Defaults to none. */
  rateLimits?: WafRateLimit[];

  /**
   * Per-rule action overrides within a managed group, e.g. set SizeRestrictions_BODY in the
   * common group to count so large request bodies pass through instead of being blocked.
   */
  managedRuleOverrides?: Partial<Record<WafManagedRuleGroup, WafManagedRuleOverride[]>>;
}

/**
 * Web application firewall for this app+environment, created once in the bootstrap phase:
 * a REGIONAL web acl (attached to each service's api gateway stage) and a CLOUDFRONT web
 * acl in us-east-1 (attached to web-entry and domain-proxy distributions). Services opt
 * into attachment with `defineWafProtection` in their (shared) service config.
 */
export const defineBootstrapWaf = (
  options?: Omit<BootstrapWafQPQConfigSetting, 'configSettingType' | 'uniqueKey'>,
): BootstrapWafQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.bootstrapWaf,
  uniqueKey: 'bootstrapWaf',

  managedRuleGroups: options?.managedRuleGroups,
  rateLimits: options?.rateLimits,
  managedRuleOverrides: options?.managedRuleOverrides,
});
