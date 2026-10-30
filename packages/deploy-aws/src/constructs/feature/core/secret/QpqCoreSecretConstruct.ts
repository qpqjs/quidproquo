import { AwsDataStoreRemovalPolicy, awsNamingUtils, qpqConfigAwsUtils, resolveAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { QPQConfig, SecretQPQConfigSetting } from '@qpqjs/core';

import { aws_iam, aws_secretsmanager } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsUtils from '../../../../utils';
import { QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqReadWriteResourceConstructBase } from '../../../base/QpqReadWriteResourceConstructBase';
import { QpqResource } from '../../../base/QpqResource';

export type QpqCoreSecretConstructProps = {
  secretConfig: SecretQPQConfigSetting;
} & QpqConstructBlockProps;

export class QpqCoreSecretConstruct extends QpqReadWriteResourceConstructBase<aws_secretsmanager.ISecret> {
  resource: aws_secretsmanager.ISecret;

  static fromOtherStack(scope: Construct, id: string, qpqConfig: QPQConfig, secretConfig: SecretQPQConfigSetting): QpqResource {
    const secretName = awsNamingUtils.resolveOwnedResourceName(secretConfig.key, qpqConfig, secretConfig.owner);

    class Import extends QpqReadWriteResourceConstructBase<aws_secretsmanager.ISecret> {
      resource = aws_secretsmanager.Secret.fromSecretNameV2(scope, `${id}-${secretConfig.uniqueKey}`, secretName);
    }

    return new Import(scope, id, { qpqConfig });
  }

  constructor(scope: Construct, id: string, props: QpqCoreSecretConstructProps) {
    super(scope, id, props);

    const dataStoreRemovalPolicy = qpqConfigAwsUtils.getAwsDataStoreRemovalPolicy(props.qpqConfig);

    this.resource = new aws_secretsmanager.Secret(this, 'secret', {
      secretName: this.resourceName(props.secretConfig.key),
      // Secret values are data too: retained unless the data-store removal policy says destroy.
      removalPolicy: dataStoreRemovalPolicy === AwsDataStoreRemovalPolicy.destroy ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      description: props.secretConfig.key,
    });

    qpqDeployAwsUtils.applyEnvironmentTags(this.resource, props.qpqConfig);
  }

  public static authorizeActionsForRole(scope: Construct, role: aws_iam.IRole, secretConfigs: SecretQPQConfigSetting[], qpqConfig: QPQConfig) {
    const { awsRegion, awsAccountId } = resolveAwsServiceAccountInfo(qpqConfig);

    qpqDeployAwsUtils.grantOwnedAndForeignResources(scope, role, qpqConfig, {
      idPrefix: 'webserverSecretAccess',
      actions: ['secretsmanager:GetSecretValue'],
      // applyEnvironmentTags stamps every owned secret.
      ownedResourceArns: [`arn:aws:secretsmanager:${awsRegion}:${awsAccountId}:secret:*`],
      ownedByTag: true,
      foreignArns: qpqDeployAwsUtils.getForeignConfigs(secretConfigs, qpqConfig).map((secretConfig) => {
        const owner = resolveAwsServiceAccountInfo(qpqConfig, secretConfig.owner);
        const secretName = awsNamingUtils.resolveOwnedResourceName(secretConfig.key, qpqConfig, secretConfig.owner);

        return `arn:aws:secretsmanager:${owner.awsRegion}:${owner.awsAccountId}:secret:${secretName}-*`;
      }),
    });
  }
}
