import { USER_SCRIPT_RUNNER_FUNCTION_NAME, UserScriptRunnerQPQConfigSetting } from 'quidproquo-core';

import { aws_ec2, aws_iam, aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { getVirtualNetworkWorkloadSecurityGroupName } from '../../../../utils';
import * as qpqDeployAwsCdkUtils from '../../../../utils/qpqDeployAwsCdkUtils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { Function } from '../../../basic/Function';

export interface QpqCoreUserScriptRunnerConstructProps extends QpqConstructBlockProps {
  userScriptRunnerConfig: UserScriptRunnerQPQConfigSetting;
}

/**
 * The sandbox that runs a service's user scripts (defineUserScriptRunner): one function on
 * its own role, which can write logs and nothing else. It never uses the service role, and
 * carries no layers or environment; the service role may invoke exactly this function.
 */
export class QpqCoreUserScriptRunnerConstruct extends QpqConstructBlock {
  public readonly function: Function;

  constructor(scope: Construct, id: string, props: QpqCoreUserScriptRunnerConstructProps) {
    super(scope, id, props);

    const { virtualNetworkName } = props.userScriptRunnerConfig;

    const vpc = virtualNetworkName
      ? aws_ec2.Vpc.fromLookup(this, 'vpc-lookup', { vpcName: this.qpqBootstrapResourceName(virtualNetworkName) })
      : undefined;

    const securityGroups =
      vpc && virtualNetworkName
        ? [
            aws_ec2.SecurityGroup.fromLookupByName(
              this,
              'workload-sg-lookup',
              getVirtualNetworkWorkloadSecurityGroupName(virtualNetworkName, props.qpqConfig),
              vpc,
            ),
          ]
        : undefined;

    const role = new aws_iam.Role(this, 'role', {
      roleName: this.resourceName(`${USER_SCRIPT_RUNNER_FUNCTION_NAME}-role`),
      assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ...(vpc ? [aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')] : []),
      ],
    });
    qpqDeployAwsCdkUtils.applyEnvironmentTags(role, props.qpqConfig);

    this.function = new Function(this, 'runner-function', {
      functionName: this.resourceName(USER_SCRIPT_RUNNER_FUNCTION_NAME),
      functionType: 'userScriptRunnerEvent_userScript',
      executorName: 'userScriptRunnerEvent_userScript',

      timeoutInSeconds: props.userScriptRunnerConfig.timeoutInSeconds,
      memoryInBytes: props.userScriptRunnerConfig.memoryInMiB,
      reservedConcurrentExecutions: props.userScriptRunnerConfig.maxConcurrentExecutions,

      qpqConfig: props.qpqConfig,

      role,
      vpc,
      securityGroups,
    });

    this.getServiceRole().addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: ['lambda:InvokeFunction'],
        resources: [this.function.lambdaFunction.functionArn],
      }),
    );
  }
}
