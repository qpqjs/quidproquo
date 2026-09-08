import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { AwsGithubDeployRoleQPQConfigSetting, qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { qpqCoreUtils } from 'quidproquo-core';

import { aws_iam, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqBootstrapConfigGithubDeployRoleConstructProps extends QpqConstructBlockProps {
  githubDeployRoleConfig: AwsGithubDeployRoleQPQConfigSetting;
}

/** Every subject claim GitHub may present for the repository + environment: the name form and, when ids are known, the immutable id form. */
export const buildGithubSubjectClaims = (config: AwsGithubDeployRoleQPQConfigSetting, githubEnvironment: string): string[] => {
  const { owner, name, ownerId, repositoryId } = config.repository;
  const claims = [`repo:${owner}/${name}:environment:${githubEnvironment}`];

  if (ownerId !== undefined && repositoryId !== undefined) {
    claims.push(`repo:${owner}@${ownerId}/${name}@${repositoryId}:environment:${githubEnvironment}`);
  }

  return claims;
};

// The role a GitHub Actions job assumes via OIDC to deploy this environment. The account's
// provider is one per account, created by the account stack (defineAccountGithubOidcProvider),
// so this only references it by its fixed ARN.
export class QpqBootstrapConfigGithubDeployRoleConstruct extends QpqConstructBlock {
  public readonly role: aws_iam.Role;

  constructor(scope: Construct, id: string, props: QpqBootstrapConfigGithubDeployRoleConstructProps) {
    super(scope, id, props);

    const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);
    const githubEnvironment = props.githubDeployRoleConfig.githubEnvironment ?? qpqCoreUtils.getApplicationModuleEnvironment(props.qpqConfig);

    this.role = new aws_iam.Role(this, 'role', {
      roleName: awsNamingUtils.getGithubDeployRoleNameFromConfig(props.qpqConfig),
      description: `GitHub Actions deploys of ${props.githubDeployRoleConfig.repository.owner}/${props.githubDeployRoleConfig.repository.name} (${githubEnvironment})`,
      assumedBy: new aws_iam.WebIdentityPrincipal(qpqConfigAwsUtils.getGithubOidcProviderArn(accountId), {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': buildGithubSubjectClaims(props.githubDeployRoleConfig, githubEnvironment),
        },
      }),
      // A deploy creates IAM roles, buckets, tables and distributions across every stack; this
      // is the same power the person running `qpq go` holds.
      managedPolicies: [aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')],
      maxSessionDuration: Duration.hours(2),
    });

    new CfnOutput(this, 'role-arn', { value: this.role.roleArn });
  }
}
