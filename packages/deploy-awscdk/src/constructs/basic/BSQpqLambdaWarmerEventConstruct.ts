import { aws_events, aws_events_targets, aws_sns } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { BootstrapResource } from '../../constants';
import { QpqConstructBlock, QpqConstructBlockProps } from '../base/QpqConstructBlock';

export interface BSQpqLambdaWarmerEventConstructConstructProps extends QpqConstructBlockProps {}

export class BSQpqLambdaWarmerEventConstructConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: BSQpqLambdaWarmerEventConstructConstructProps) {
    super(scope, id, props);

    const rule = new aws_events.Rule(this, 'WarmLambdaRule', {
      ruleName: this.qpqBootstrapResourceName(BootstrapResource.WarmLambdas),
      // Create an EventBridge rule to trigger the Lambda every X minutes
      schedule: aws_events.Schedule.expression('rate(5 minutes)'),
    });

    const topic = new aws_sns.Topic(this, 'MyTopic', {
      topicName: this.qpqBootstrapResourceName(BootstrapResource.WarmLambdas),
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
