import { assertLambdaMemoryInMiB, assertLambdaTimeoutInSeconds } from '@qpqjs/config-aws';
import { USER_SCRIPT_RUNNER_FUNCTION_NAME, UserScriptRunnerQPQConfigSetting } from '@qpqjs/core';

import { aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as qpqDeployAwsUtils from '../../../../utils/qpqDeployAwsUtils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { Function } from '../../../basic/Function';

export type QpqCoreUserScriptRunnerConstructProps = {
  userScriptRunnerConfig: UserScriptRunnerQPQConfigSetting;
} & QpqConstructBlockProps;

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

    const role = new aws_iam.Role(this, 'role', {
      roleName: this.resourceName(`${USER_SCRIPT_RUNNER_FUNCTION_NAME}-role`),
      assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ...(virtualNetworkName ? [aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')] : []),
      ],
    });
    qpqDeployAwsUtils.applyEnvironmentTags(role, props.qpqConfig);

    // The sandbox's limits are config; lambda's own ceilings are checked here, where it deploys.
    assertLambdaTimeoutInSeconds(props.userScriptRunnerConfig.timeoutInSeconds, 'defineUserScriptRunner');
    assertLambdaMemoryInMiB(props.userScriptRunnerConfig.memoryInMiB, 'defineUserScriptRunner');

    this.function = new Function(this, 'runner-function', {
      functionName: this.resourceName(USER_SCRIPT_RUNNER_FUNCTION_NAME),
      handler: 'userScriptRunnerEvent_userScript',

      timeoutInSeconds: props.userScriptRunnerConfig.timeoutInSeconds,
      memoryInBytes: props.userScriptRunnerConfig.memoryInMiB,
      reservedConcurrentExecutions: props.userScriptRunnerConfig.maxConcurrentExecutions,

      qpqConfig: props.qpqConfig,

      role,
      virtualNetworkName,
    });

    this.getServiceRole().addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: ['lambda:InvokeFunction'],
        resources: [this.function.lambdaFunction.functionArn],
      }),
    );
  }
}
