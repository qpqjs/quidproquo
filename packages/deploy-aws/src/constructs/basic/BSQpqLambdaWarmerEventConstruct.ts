import { awsNamingUtils } from '@qpqjs/config-aws';

import { aws_events, aws_events_targets, aws_sns } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../base/QpqConstructBlock';

export type BSQpqLambdaWarmerEventConstructProps = {} & QpqConstructBlockProps;

export class BSQpqLambdaWarmerEventConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: BSQpqLambdaWarmerEventConstructProps) {
    super(scope, id, props);

    const rule = new aws_events.Rule(this, 'WarmLambdaRule', {
      ruleName: awsNamingUtils.getWarmLambdasTopicName(this.qpqConfig),
      schedule: aws_events.Schedule.expression('rate(5 minutes)'),
    });

    const topic = new aws_sns.Topic(this, 'MyTopic', {
      topicName: awsNamingUtils.getWarmLambdasTopicName(this.qpqConfig),
      displayName: 'Warm Lambdas',
    });

    rule.addTarget(
      new aws_events_targets.SnsTopic(topic, {
        message: aws_events.RuleTargetInput.fromObject({
          type: 'QpqLambdaWarmerEvent',
        }),
      }),
    );
  }
}
