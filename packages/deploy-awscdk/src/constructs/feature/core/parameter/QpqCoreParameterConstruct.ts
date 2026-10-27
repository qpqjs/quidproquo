import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { resolveAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { ParameterQPQConfigSetting, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { aws_iam, aws_ssm } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsCdkUtils from '../../../../utils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { QpqResource } from '../../../base/QpqResource';

export interface QpqCoreParameterConstructProps extends QpqConstructBlockProps {
  parameterConfig: ParameterQPQConfigSetting;
}

export abstract class QpqCoreParameterConstructBase extends QpqConstructBlock {
  abstract stringParameter: aws_ssm.IStringParameter;

  public grantRead(grantee: aws_iam.IGrantable) {
    this.stringParameter.grantRead(grantee);
  }

  public grantWrite(grantee: aws_iam.IGrantable): void {
    this.stringParameter.grantWrite(grantee);
  }

  public grantAll(grantee: aws_iam.IGrantable): void {
    this.grantRead(grantee);
    this.grantWrite(grantee);
  }
}

export class QpqCoreParameterConstruct extends QpqCoreParameterConstructBase {
  stringParameter: aws_ssm.IStringParameter;

  static fromOtherStack(scope: Construct, id: string, qpqConfig: QPQConfig, parameterConfig: ParameterQPQConfigSetting): QpqResource {
    const paramName = awsNamingUtils.resolveConfigRuntimeResourceNameFromConfig(parameterConfig.key, qpqConfig, parameterConfig.owner);

    class Import extends QpqCoreParameterConstructBase {
      stringParameter = aws_ssm.StringParameter.fromStringParameterName(scope, `${id}-${parameterConfig.uniqueKey}`, paramName);
    }

    return new Import(scope, id, { qpqConfig });
  }

  constructor(scope: Construct, id: string, props: QpqCoreParameterConstructProps) {
    super(scope, id, props);

    this.stringParameter = new aws_ssm.StringParameter(this, 'param', {
      parameterName: this.resourceName(props.parameterConfig.key),
      description: props.parameterConfig.key,
      stringValue: props.parameterConfig.value || 'Please set a value',

      // No additional costs ~ 4k max size
      tier: aws_ssm.ParameterTier.STANDARD,
    });

    qpqDeployAwsCdkUtils.applyEnvironmentTags(this.stringParameter, props.qpqConfig);
  }

  public static authorizeActionsForRole(scope: Construct, role: aws_iam.IRole, parameterConfigs: ParameterQPQConfigSetting[], qpqConfig: QPQConfig) {
    const parameterActions = ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:DescribeParameters'];

    // Owned parameters are granted as a single tag-conditioned statement instead of one
    // ARN per parameter: applyEnvironmentTags stamps every owned parameter, so the
    // policy stays a fixed size no matter how many parameters the service declares.
    const { awsRegion: ownRegion, awsAccountId: ownAccountId } = resolveAwsServiceAccountInfo(qpqConfig);

    role.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: parameterActions,
        resources: [`arn:aws:ssm:${ownRegion}:${ownAccountId}:parameter/*`],
        conditions: {
          StringEquals: qpqDeployAwsCdkUtils.getOwnedResourceTagConditions(qpqConfig),
        },
      }),
    );

    // Cross-service parameters stay as exact ARNs on purpose: this short list is
    // the part of the policy a human should be reviewing.
    const ownedConfigs = qpqCoreUtils.getOwnedItems(parameterConfigs, qpqConfig);
    const foreignConfigs = parameterConfigs.filter((cfg) => !ownedConfigs.includes(cfg));

    const foreignArns = foreignConfigs.map((parameterConfig) => {
      const { awsRegion, awsAccountId } = resolveAwsServiceAccountInfo(qpqConfig, parameterConfig.owner);

      const paramName = awsNamingUtils.resolveConfigRuntimeResourceNameFromConfig(parameterConfig.key, qpqConfig, parameterConfig.owner);

      return `arn:aws:ssm:${awsRegion}:${awsAccountId}:parameter/${paramName}`;
    });

    if (foreignArns.length > 0) {
      // Off the inline DefaultPolicy (10,240-byte cap) onto managed policies.
      qpqDeployAwsCdkUtils.attachManagedResourcePolicies(scope, role, 'webserverParameterAccess', parameterActions, foreignArns);
    }
  }
}
