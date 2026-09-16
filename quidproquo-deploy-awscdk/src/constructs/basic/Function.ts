import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { getAwsServiceAccountInfoConfig } from 'quidproquo-config-aws';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { aws_ec2, aws_iam, aws_lambda, aws_logs, aws_sns, aws_sns_subscriptions } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'upath';

import { BootstrapResource } from '../../constants';
import { getLambdaArchitecture, getLambdaRuntime, qpqAwsCdkPathUtils } from '../../utils';
import * as qpqDeployAwsCdkUtils from '../../utils/qpqDeployAwsCdkUtils';
import { QpqConstructBlock, QpqConstructBlockProps } from '../base/QpqConstructBlock';

export interface FunctionProps extends QpqConstructBlockProps {
  functionName?: string;

  srcFilename?: string;
  functionType: string; // TODO: Rename this to subFolder / folder or something
  executorName: string; // TODO: Rename this to handlerName or something maybe?

  timeoutInSeconds?: number;
  memoryInBytes?: number;

  environment?: {
    [key: string]: string;
  };

  apiLayerVersions?: aws_lambda.ILayerVersion[];

  reservedConcurrentExecutions?: number;

  role?: aws_iam.IRole;

  reacreateOnFunctionNameChange?: boolean;

  vpc?: aws_ec2.IVpc;
  securityGroups?: aws_ec2.ISecurityGroup[];
}

// Resolves the federated code store location for this service, if it opted in via
// defineFederatedModuleStore. Points the lambda at the referenced storage drive's
// bucket, namespaced by service (s3://<bucket>/<service>), so many services can share
// one bucket. Read access comes from the storage drive's own grants. Returns {} when
// federation isn't configured, so the lambda runs only its bundled code.
const getFederatedCodeStoreEnv = (qpqConfig: QPQConfig): Record<string, string> => {
  const federatedStore = qpqCoreUtils.getFederatedModuleStore(qpqConfig);
  if (!federatedStore) {
    return {};
  }

  const storageDrive = qpqCoreUtils.getStorageDriveByName(federatedStore.storageDrive, qpqConfig);
  if (!storageDrive) {
    throw new Error(
      `defineFederatedModuleStore references storage drive [${federatedStore.storageDrive}] which is not defined - add a matching defineStorageDrive`,
    );
  }

  const bucketName = awsNamingUtils.resolveConfigRuntimeResourceNameFromConfig(
    storageDrive.owner?.resourceNameOverride || storageDrive.storageDrive,
    qpqConfig,
    storageDrive.owner,
  );
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  return {
    federatedCodeStoreUrl: `s3://${bucketName}/${serviceName}`,
    ...(federatedStore.recheckMs !== undefined ? { federatedCodeStoreRecheckMs: `${federatedStore.recheckMs}` } : {}),
  };
};

export class Function extends QpqConstructBlock {
  public readonly lambdaFunction: aws_lambda.Function;

  constructor(scope: Construct, id: string, props: FunctionProps) {
    super(scope, id, props);

    console.log(`Function: [${props.functionName || ''}]::${props.functionName?.length}`);

    const handlerFile = props.srcFilename || 'index';

    const serviceInfo = getAwsServiceAccountInfoConfig(props.qpqConfig);

    const functionId = props.reacreateOnFunctionNameChange && props.functionName ? props.functionName : 'function';

    this.lambdaFunction = new aws_lambda.Function(this, functionId, {
      functionName: props.functionName,
      timeout: cdk.Duration.seconds(props.timeoutInSeconds || 25),

      runtime: getLambdaRuntime(props.qpqConfig),
      architecture: getLambdaArchitecture(props.qpqConfig),
      memorySize: props.memoryInBytes || serviceInfo.lambdaMaxMemoryInMiB || 1024,
      layers: props.apiLayerVersions,

      code: aws_lambda.Code.fromAsset(join(qpqAwsCdkPathUtils.getApiBuildPathFullPath(props.qpqConfig), props.functionType)),
      handler: `${handlerFile}.${props.executorName}`,

      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        // Federated code store (only when the service opted in via
        // defineFederatedModuleStore); the loader falls back to bundled modules
        // while the store has nothing published for this service
        ...getFederatedCodeStoreEnv(props.qpqConfig),
        ...(props.environment || {}),
      },

      reservedConcurrentExecutions: qpqConfigAwsUtils.isReservedConcurrencyDisabled(props.qpqConfig) ? undefined : props.reservedConcurrentExecutions,

      // Lambda's recursive loop detection drops an async self-invocation after 16
      // hops. A service function that hands a long AI turn to itself (eventDocAi's
      // ChatContinue) can legitimately exceed that; qpq's own session depth limit
      // (100) is the guard against a true runaway. Enable this if a chain ever
      // needs more than 16 hops.
      // recursiveLoop: aws_lambda.RecursiveLoop.ALLOW,

      tracing: qpqConfigAwsUtils.isTracingDisabled(props.qpqConfig) ? aws_lambda.Tracing.DISABLED : aws_lambda.Tracing.ACTIVE,

      logGroup: new aws_logs.LogGroup(this, 'LogGroup', {
        retention: aws_logs.RetentionDays.ONE_YEAR,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),

      role: props.role,

      vpc: props.vpc,
      vpcSubnets: props.vpc
        ? {
            subnetType: aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
          }
        : undefined,
      securityGroups: props.securityGroups,
    });

    qpqDeployAwsCdkUtils.applyEnvironmentTags(this.lambdaFunction, props.qpqConfig);

    if (!qpqConfigAwsUtils.isLambdaWarmingDisabled(props.qpqConfig)) {
      const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig);
      const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);

      const topicName = this.qpqBootstrapResourceName(BootstrapResource.WarmLambdas);
      const topicArn = `arn:aws:sns:${region}:${accountId}:${topicName}`;
      const topic = aws_sns.Topic.fromTopicArn(this, 'ImportedTopic', topicArn);

      topic.addSubscription(new aws_sns_subscriptions.LambdaSubscription(this.lambdaFunction));
    }
  }
}
