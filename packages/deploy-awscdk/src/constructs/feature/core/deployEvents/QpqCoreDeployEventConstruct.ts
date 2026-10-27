import { DeployEventsQPQConfigSetting, qpqCoreUtils } from 'quidproquo-core';

import { aws_events, aws_events_targets, aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { Function } from '../../../basic/Function';

export interface QpqCoreDeployEventConstructProps extends QpqConstructBlockProps {
  deployEventConfig: DeployEventsQPQConfigSetting;
  apiLayerVersions?: aws_lambda.ILayerVersion[];
}

export class QpqCoreDeployEventConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqCoreDeployEventConstructProps) {
    super(scope, id, props);

    const func = new Function(this, props.deployEventConfig.uniqueKey, {
      functionName: this.qpqResourceName(`${props.deployEventConfig.name}`, 'de'),
      functionType: 'eventBridgeEvent_stackDeploy',
      executorName: 'eventBridgeEvent_stackDeploy',

      qpqConfig: props.qpqConfig,

      apiLayerVersions: props.apiLayerVersions,

      // 15 min timeout
      timeoutInSeconds: 15 * 60,

      environment: {
        deployEventConfigName: props.deployEventConfig.name,
      },

      role: this.getServiceRole(),
    });

    // Create a CloudWatch Event that triggers when CloudFormation stack deploys
    const rule = new aws_events.Rule(this, 'Rule', {
      eventPattern: {
        source: ['aws.cloudformation'],
        detailType: ['CloudFormation Stack Status Change'],
      },
    });

    // Add Lambda as the target of the CloudWatch Event
    rule.addTarget(new aws_events_targets.LambdaFunction(func.lambdaFunction));
  }
}
