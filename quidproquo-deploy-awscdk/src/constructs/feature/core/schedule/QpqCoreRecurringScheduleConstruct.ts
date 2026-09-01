import { LambdaRuntimeConfig } from 'quidproquo-actionprocessor-awslambda';
import { resolveScheduleFields, ScheduleQPQConfigSetting } from 'quidproquo-core';

import { aws_events, aws_events_targets, aws_lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { Function } from '../../../basic/Function';
import { renderAwsCronExpression } from './renderAwsCronExpression';

export interface QpqCoreRecurringScheduleConstructProps extends QpqConstructBlockProps {
  scheduleConfig: ScheduleQPQConfigSetting;
  apiLayerVersions?: aws_lambda.ILayerVersion[];
}

export class QpqCoreRecurringScheduleConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqCoreRecurringScheduleConstructProps) {
    super(scope, id, props);

    const schedulerFunction = new Function(this, props.scheduleConfig.uniqueKey, {
      functionName: this.resourceName(`${props.scheduleConfig.uniqueKey}-SE`),
      functionType: 'eventBridgeEvent_recurringSchedule',
      executorName: 'eventBridgeEvent_recurringSchedule',

      qpqConfig: props.qpqConfig,

      apiLayerVersions: props.apiLayerVersions,

      environment: {
        lambdaRuntimeConfig: JSON.stringify({
          runtime: props.scheduleConfig.runtime,
        } as LambdaRuntimeConfig),
      },

      // 15 min timeout
      timeoutInSeconds: 15 * 60,

      reservedConcurrentExecutions: props.scheduleConfig.maxConcurrentExecutions,

      role: this.getServiceRole(),
    });

    // The declared recurrence, rendered into the dialect EventBridge speaks.
    // This is the only place that conversion happens; the config itself is
    // platform-neutral so the dev server can honour the same declaration.
    const cronRule = new aws_events.Rule(this, 'cron', {
      schedule: aws_events.Schedule.expression(`cron(${renderAwsCronExpression(resolveScheduleFields(props.scheduleConfig.recurrence))})`),
    });

    // Set the target as lambda function.
    //
    // fromObject REPLACES the event payload rather than adding to it, so
    // anything the handler needs has to be listed here: without `time` the
    // lambda was handed an event with no time at all, and every schedule story
    // saw `ScheduledEventParams.time` as undefined despite the type saying
    // otherwise. EventField.time substitutes the real firing time back in.
    cronRule.addTarget(
      new aws_events_targets.LambdaFunction(schedulerFunction.lambdaFunction, {
        event: aws_events.RuleTargetInput.fromObject({
          source: 'custom.event.RecurringSchedule',
          'detail-type': 'Recurring Schedule',
          time: aws_events.EventField.time,
          detail: props.scheduleConfig.metadata,
        }),
      }),
    );
  }
}
