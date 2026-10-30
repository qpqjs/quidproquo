import { awsNamingUtils, resolveAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { ParameterQPQConfigSetting, QPQConfig } from '@qpqjs/core';

import { aws_iam, aws_ssm } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsUtils from '../../../../utils';
import { QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqReadWriteResourceConstructBase } from '../../../base/QpqReadWriteResourceConstructBase';
import { QpqResource } from '../../../base/QpqResource';

export type QpqCoreParameterConstructProps = {
  parameterConfig: ParameterQPQConfigSetting;
} & QpqConstructBlockProps;

export class QpqCoreParameterConstruct extends QpqReadWriteResourceConstructBase<aws_ssm.IStringParameter> {
  resource: aws_ssm.IStringParameter;

  static fromOtherStack(scope: Construct, id: string, qpqConfig: QPQConfig, parameterConfig: ParameterQPQConfigSetting): QpqResource {
    const paramName = awsNamingUtils.resolveOwnedResourceName(parameterConfig.key, qpqConfig, parameterConfig.owner);

    class Import extends QpqReadWriteResourceConstructBase<aws_ssm.IStringParameter> {
      resource = aws_ssm.StringParameter.fromStringParameterName(scope, `${id}-${parameterConfig.uniqueKey}`, paramName);
    }

    return new Import(scope, id, { qpqConfig });
  }

  constructor(scope: Construct, id: string, props: QpqCoreParameterConstructProps) {
    super(scope, id, props);

    this.resource = new aws_ssm.StringParameter(this, 'param', {
      parameterName: this.resourceName(props.parameterConfig.key),
      description: props.parameterConfig.key,
      stringValue: props.parameterConfig.value || 'Please set a value',

      // No additional costs ~ 4k max size
      tier: aws_ssm.ParameterTier.STANDARD,
    });

    qpqDeployAwsUtils.applyEnvironmentTags(this.resource, props.qpqConfig);
  }

  public static authorizeActionsForRole(scope: Construct, role: aws_iam.IRole, parameterConfigs: ParameterQPQConfigSetting[], qpqConfig: QPQConfig) {
    const { awsRegion, awsAccountId } = resolveAwsServiceAccountInfo(qpqConfig);

    qpqDeployAwsUtils.grantOwnedAndForeignResources(scope, role, qpqConfig, {
      idPrefix: 'webserverParameterAccess',
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:DescribeParameters'],
      // applyEnvironmentTags stamps every owned parameter.
      ownedResourceArns: [`arn:aws:ssm:${awsRegion}:${awsAccountId}:parameter/*`],
      ownedByTag: true,
      foreignArns: qpqDeployAwsUtils.getForeignConfigs(parameterConfigs, qpqConfig).map((parameterConfig) => {
        const owner = resolveAwsServiceAccountInfo(qpqConfig, parameterConfig.owner);
        const paramName = awsNamingUtils.resolveOwnedResourceName(parameterConfig.key, qpqConfig, parameterConfig.owner);

        return `arn:aws:ssm:${owner.awsRegion}:${owner.awsAccountId}:parameter/${paramName}`;
      }),
    });
  }
}
