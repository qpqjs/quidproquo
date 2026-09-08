// App-specific bootstrap extras: the root domains, WAF, the api domain, and the
// domain certificates. The identity plumbing (defineApplication +
// defineAwsServiceAccountInfo) is provided by quidproquo-deploy-awscdk's
// workspace CDK app; this fragment must not declare its own.
import { defineApi, defineDns, QPQConfig } from 'quidproquo';
import {
  defineAwsGithubDeployRole,
  defineBootstrapWaf,
  defineDomainCertificate,
  WafManagedRuleGroup,
  WafRuleOverrideAction,
} from 'quidproquo-config-aws';
import { QpqAppDeployContext } from 'quidproquo-deploy-awscdk';

import { QPQJS_DOMAINS, QpqjsServiceEnum } from '@qpqjs/constants';

export default ({ region }: QpqAppDeployContext): QPQConfig => [
  defineDns(QPQJS_DOMAINS),

  // The role the deploy workflow assumes (ids from `gh api repos/qpqjs/quidproquo`).
  defineAwsGithubDeployRole('qpqjs/quidproquo', { ownerId: 314167689, repositoryId: 571382961 }),

  defineBootstrapWaf({
    rateLimits: [{ name: 'all-traffic', limit: 2000 }],
    managedRuleGroups: [
      WafManagedRuleGroup.common,
      WafManagedRuleGroup.ipReputation,
      WafManagedRuleGroup.knownBadInputs,
      WafManagedRuleGroup.sqli,
    ],
    managedRuleOverrides: {
      [WafManagedRuleGroup.common]: [
        { name: 'SizeRestrictions_BODY', action: WafRuleOverrideAction.count }, // Disable the 8kb limit
      ],
    },
  }),

  defineApi('api'),

  // CloudFront (us-east-1): the site root plus every web entry, on every root domain.
  defineDomainCertificate(
    'us-east-1',
    [
      { subdomain: 'www' },
      { subdomain: 'views' },
      { subdomain: 'docs' },
      { subdomain: 'storybook' },
    ],
    { includeApex: true }
  ),

  // Regional API Gateway: the api and the admin websocket.
  defineDomainCertificate(region, [
    { subdomain: 'api' },
    { subdomain: 'qpqadmin', service: QpqjsServiceEnum.Admin },
  ]),
];
