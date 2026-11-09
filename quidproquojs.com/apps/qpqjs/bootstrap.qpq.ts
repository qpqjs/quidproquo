// App-specific bootstrap extras: the root domains, WAF, the api domain, and the
// domain certificates. The identity plumbing (defineApplication +
// defineAwsServiceAccountInfo) is provided by @qpqjs/deploy-aws's
// workspace CDK app; this fragment must not declare its own.
import { defineAwsGithubDeployRole, defineDomainCertificate } from '@qpqjs/config-aws';
import { QpqjsServiceEnum } from '@qpqjs/constants';
import { QpqAppDeployContext } from '@qpqjs/deploy-aws';
import { defineApi, defineDns, defineEmailReceivingDomain, getDeploySettingList, QPQConfig } from 'quidproquo';

export default ({ region }: QpqAppDeployContext): QPQConfig => [
  defineDns(getDeploySettingList('ROOT_DOMAINS')),

  // inbox.<env>.<root>: verified with SES and MX-routed to it, for every defineEmailReceiver.
  defineEmailReceivingDomain('inbox'),

  // The role the deploy workflow assumes (ids from `gh api repos/qpqjs/quidproquo`).
  defineAwsGithubDeployRole('qpqjs/quidproquo', {
    ownerId: 314167689,
    repositoryId: 571382961,
  }),

  // No WAF. The two web ACLs (regional and CloudFront) and their five rules were $20 a month per
  // environment, 60 percent of the development account's bill, for a site with almost no traffic.
  // Shield Standard still covers CloudFront and API Gateway against network level floods for free.
  // Bring it back with `defineBootstrapWaf` here and `defineWafProtection` in defineQpqjsService
  // (a rate limit alone is one rule, $6 an ACL) if the site ever draws real abuse.
  // defineBootstrapWaf({
  //   rateLimits: [{ name: 'all-traffic', limit: 2000 }],
  //   managedRuleGroups: [WafManagedRuleGroup.common, WafManagedRuleGroup.ipReputation, WafManagedRuleGroup.knownBadInputs, WafManagedRuleGroup.sqli],
  //   managedRuleOverrides: {
  //     [WafManagedRuleGroup.common]: [
  //       { name: 'SizeRestrictions_BODY', action: WafRuleOverrideAction.count }, // Disable the 8kb limit
  //     ],
  //   },
  // }),

  defineApi('api'),

  // CloudFront (us-east-1): the site root plus every web entry, on every root domain.
  defineDomainCertificate('us-east-1', [{ subdomain: 'www' }, { subdomain: 'views' }, { subdomain: 'docs' }, { subdomain: 'storybook' }], {
    includeApex: true,
  }),

  // Regional API Gateway: the api and the admin websocket.
  defineDomainCertificate(region, [{ subdomain: 'api' }, { subdomain: 'qpqadmin', service: QpqjsServiceEnum.Admin }]),
];
