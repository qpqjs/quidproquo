import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { resolveAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { QPQConfig, qpqCoreUtils, SecretQPQConfigSetting } from 'quidproquo-core';

import { aws_iam, aws_secretsmanager } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsCdkUtils from '../../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqResource } from '../../../base/QpqResource';

export interface QpqCoreSecretConstructProps extends QpqConstructBlockProps {
  secretConfig: SecretQPQConfigSetting;
}

export abstract class QpqCoreSecretConstructBase extends QpqConstructBlock implements QpqResource {
  abstract secret: aws_secretsmanager.ISecret;

  public grantRead(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.secret.grantRead(grantee);
  }

  public grantWrite(grantee: aws_iam.IGrantable): aws_iam.Grant {
    return this.secret.grantWrite(grantee);
  }

  public grantAll(grantee: aws_iam.IGrantable): void {
    this.grantRead(grantee);
    this.grantWrite(grantee);
  }
}

export class QpqCoreSecretConstruct extends QpqCoreSecretConstructBase {
  secret: aws_secretsmanager.ISecret;

  static fromOtherStack(scope: Construct, id: string, qpqConfig: QPQConfig, secretConfig: SecretQPQConfigSetting): QpqResource {
    const secretName = awsNamingUtils.resolveConfigRuntimeResourceNameFromConfig(secretConfig.key, qpqConfig, secretConfig.owner);

    class Import extends QpqCoreSecretConstructBase {
      secret = aws_secretsmanager.Secret.fromSecretNameV2(scope, `${id}-${secretConfig.uniqueKey}`, secretName);
    }

    return new Import(scope, id, { qpqConfig });
  }

  constructor(scope: Construct, id: string, props: QpqCoreSecretConstructProps) {
    super(scope, id, props);

    this.secret = new aws_secretsmanager.Secret(this, 'secret', {
      secretName: this.resourceName(props.secretConfig.key),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      description: props.secretConfig.key,
    });

    qpqDeployAwsCdkUtils.applyEnvironmentTags(this.secret, props.qpqConfig);
  }

  public static authorizeActionsForRole(scope: Construct, role: aws_iam.IRole, secretConfigs: SecretQPQConfigSetting[], qpqConfig: QPQConfig) {
    const secretActions = ['secretsmanager:GetSecretValue'];

    // Owned secrets are granted as a single tag-conditioned statement instead of one
    // ARN per secret: applyEnvironmentTags stamps every owned secret, so the policy
    // stays a fixed size no matter how many secrets the service declares.
    const { awsRegion: ownRegion, awsAccountId: ownAccountId } = resolveAwsServiceAccountInfo(qpqConfig);

    role.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: secretActions,
        resources: [`arn:aws:secretsmanager:${ownRegion}:${ownAccountId}:secret:*`],
        conditions: {
          StringEquals: qpqDeployAwsCdkUtils.getOwnedResourceTagConditions(qpqConfig),
        },
      }),
    );

    // Cross-service secrets stay as exact ARNs on purpose: this short list is
    // the part of the policy a human should be reviewing.
    const ownedConfigs = qpqCoreUtils.getOwnedItems(secretConfigs, qpqConfig);
    const foreignConfigs = secretConfigs.filter((cfg) => !ownedConfigs.includes(cfg));

    const foreignArns = foreignConfigs.map((secretConfig) => {
      const { awsRegion, awsAccountId } = resolveAwsServiceAccountInfo(qpqConfig, secretConfig.owner);

      const secretName = awsNamingUtils.resolveConfigRuntimeResourceNameFromConfig(secretConfig.key, qpqConfig, secretConfig.owner);

      return `arn:aws:secretsmanager:${awsRegion}:${awsAccountId}:secret:${secretName}-*`;
    });

    if (foreignArns.length > 0) {
      // Off the inline DefaultPolicy (10,240-byte cap) onto managed policies.
      qpqDeployAwsCdkUtils.attachManagedResourcePolicies(scope, role, 'webserverSecretAccess', secretActions, foreignArns);
    }
  }
}
