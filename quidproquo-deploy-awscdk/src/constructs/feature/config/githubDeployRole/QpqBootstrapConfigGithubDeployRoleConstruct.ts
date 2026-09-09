import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { AwsGithubDeployRoleQPQConfigSetting, qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { qpqCoreUtils } from 'quidproquo-core';

import { aws_iam, CfnOutput, DefaultStackSynthesizer, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqBootstrapConfigGithubDeployRoleConstructProps extends QpqConstructBlockProps {
  githubDeployRoleConfig: AwsGithubDeployRoleQPQConfigSetting;
}

/** The subject claims GitHub may present: the immutable-id form when ids are known, the name form when there are none or it was asked for. */
export const buildGithubSubjectClaims = (config: AwsGithubDeployRoleQPQConfigSetting, githubEnvironment: string): string[] => {
  const { owner, name, ownerId, repositoryId } = config.repository;
  const claims: string[] = [];

  if (ownerId !== undefined && repositoryId !== undefined) {
    claims.push(`repo:${owner}@${ownerId}/${name}@${repositoryId}:environment:${githubEnvironment}`);
  }
  if (config.trustNameForm) {
    claims.push(`repo:${owner}/${name}:environment:${githubEnvironment}`);
  }

  return claims;
};

// The roles `cdk deploy` assumes; CloudFormation applies the change set as the bootstrap's
// exec role, so the deploy identity never needs the permissions of what it deploys.
const cdkBootstrapRoles = ['deploy-role', 'file-publishing-role', 'image-publishing-role', 'lookup-role'];

const buildCdkAssumeStatement = (accountId: string, regions: string[]): aws_iam.PolicyStatement =>
  new aws_iam.PolicyStatement({
    sid: 'AssumeCdkBootstrapRoles',
    actions: ['sts:AssumeRole'],
    resources: regions.flatMap((region) =>
      cdkBootstrapRoles.map(
        (role) => `arn:aws:iam::${accountId}:role/cdk-${DefaultStackSynthesizer.DEFAULT_QUALIFIER}-${role}-${accountId}-${region}`,
      ),
    ),
  });

// Outside CloudFormation a deploy only syncs built views and federated remotes into this
// app's buckets, which are all named `<name>-<app>-<service>-<env>[-<feature>]`.
const buildAppBucketStatements = (application: string, environment: string, feature: string | undefined): aws_iam.PolicyStatement[] => {
  const suffix = feature ? `${application}-*-${environment}-${feature}` : `${application}-*-${environment}`;
  const bucketArn = `arn:aws:s3:::*-${suffix}`;

  return [
    new aws_iam.PolicyStatement({ sid: 'ListAppBuckets', actions: ['s3:ListBucket', 's3:GetBucketLocation'], resources: [bucketArn] }),
    new aws_iam.PolicyStatement({
      sid: 'WriteAppBuckets',
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: [`${bucketArn}/*`],
    }),
  ];
};

// The role a GitHub Actions job assumes via OIDC to deploy this environment. The account's
// provider is one per account, created by the account stack (defineAccountGithubOidcProvider),
// so this only references it by its fixed ARN.
export class QpqBootstrapConfigGithubDeployRoleConstruct extends QpqConstructBlock {
  public readonly role: aws_iam.Role;

  constructor(scope: Construct, id: string, props: QpqBootstrapConfigGithubDeployRoleConstructProps) {
    super(scope, id, props);

    const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);
    const deployRegion = qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig);
    const application = qpqCoreUtils.getApplicationName(props.qpqConfig);
    const environment = qpqCoreUtils.getApplicationModuleEnvironment(props.qpqConfig);
    const feature = qpqCoreUtils.getApplicationModuleFeature(props.qpqConfig);
    const githubEnvironment = props.githubDeployRoleConfig.githubEnvironment ?? environment;

    // Every region the app's stacks land in: the deploy region plus the certificate regions.
    const regions = [...new Set([deployRegion, ...qpqConfigAwsUtils.getDomainCertificateConfigs(props.qpqConfig).map((cert) => cert.region)])];

    this.role = new aws_iam.Role(this, 'role', {
      roleName: awsNamingUtils.getGithubDeployRoleNameFromConfig(props.qpqConfig),
      description: `GitHub Actions deploys of ${props.githubDeployRoleConfig.repository.owner}/${props.githubDeployRoleConfig.repository.name} (${githubEnvironment})`,
      assumedBy: new aws_iam.WebIdentityPrincipal(qpqConfigAwsUtils.getGithubOidcProviderArn(accountId), {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': buildGithubSubjectClaims(props.githubDeployRoleConfig, githubEnvironment),
        },
      }),
      inlinePolicies: {
        deploy: new aws_iam.PolicyDocument({
          statements: [
            buildCdkAssumeStatement(accountId, regions),
            ...buildAppBucketStatements(application, environment, feature),
            // The cdk cli reads the bootstrap version and qpq reads its own parameters.
            new aws_iam.PolicyStatement({
              sid: 'ReadDeployParameters',
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [`arn:aws:ssm:*:${accountId}:parameter/cdk-bootstrap/*`, `arn:aws:ssm:*:${accountId}:parameter/qpq/*`],
            }),
          ],
        }),
      },
      maxSessionDuration: Duration.hours(2),
    });

    new CfnOutput(this, 'role-arn', { value: this.role.roleArn });
  }
}
