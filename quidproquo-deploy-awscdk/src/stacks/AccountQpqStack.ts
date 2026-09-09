import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { qpqCoreUtils } from 'quidproquo-core';

import { Construct } from 'constructs';

import {
  QpqAccountBudgetConstruct,
  QpqAccountCloudTrailConstruct,
  QpqAccountGithubOidcProviderConstruct,
  QpqAccountSecurityServicesConstruct,
} from '../constructs';
import { QpqServiceStack, QpqServiceStackProps } from './base/QpqServiceStack';

export interface AccountQpqStackProps extends QpqServiceStackProps {}

// Owns account-level resources (audit trail, budgets, security services) so they never
// share an app's lifecycle - tearing down an app's bootstrap must not take the account's
// protections with it. Deployed once per account from a dedicated account config
// (defineApplication + defineAwsServiceAccountInfo + defineAccount* settings, no module),
// statically named 'qpq-account' - see getAccountStackName for the sharing constraints.
export class AccountQpqStack extends QpqServiceStack {
  constructor(scope: Construct, id: string, props: AccountQpqStackProps) {
    super(scope, id, props);

    const cloudTrails = qpqConfigAwsUtils.getAccountCloudTrailConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqAccountCloudTrailConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          cloudTrailConfig: setting,
        }),
    );

    const budgets = qpqConfigAwsUtils.getAccountBudgetConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqAccountBudgetConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          budgetConfig: setting,
        }),
    );

    if (qpqConfigAwsUtils.isAccountGithubOidcProviderDeclared(props.qpqConfig)) {
      new QpqAccountGithubOidcProviderConstruct(this, 'github-oidc-provider', {
        qpqConfig: props.qpqConfig,
      });
    }

    const securityServicesConfig = qpqConfigAwsUtils.getAccountSecurityServicesConfig(props.qpqConfig);
    if (securityServicesConfig) {
      new QpqAccountSecurityServicesConstruct(this, 'security-services', {
        qpqConfig: props.qpqConfig,

        securityServicesConfig,

        // For the cognito auth-failure metric filter (when a trail publishes to CloudWatch)
        cloudTrailLogGroup: cloudTrails.find((cloudTrail) => cloudTrail.logGroup)?.logGroup,
      });
    }
  }
}
