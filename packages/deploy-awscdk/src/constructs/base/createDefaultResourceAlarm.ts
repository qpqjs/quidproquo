import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { aws_cloudwatch, aws_cloudwatch_actions } from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Imported by direct path (not the ../feature/core barrel) to avoid an import
// cycle: resource constructs import this helper, and the barrel re-exports those
// same resource constructs.
import { QpqCoreEventBusConstruct } from '../feature/core/eventBus/QpqCoreEventBusConstruct';

export interface DefaultResourceAlarmProps {
  /** Construct id (also seeds the per-event-bus action ids). */
  id: string;
  alarmName: string;
  metric: aws_cloudwatch.IMetric;
  threshold: number;
  comparisonOperator?: aws_cloudwatch.ComparisonOperator;
  evaluationPeriods?: number;
  datapointsToAlarm?: number;
}

/** Event buses that error/alarm notifications route to (from `defineNotifyError`). */
export const getNotifyErrorEventBusNames = (qpqConfig: QPQConfig): string[] => {
  const names = qpqCoreUtils.getNotifyErrorConfigs(qpqConfig).flatMap((config) => config.onAlarm.publishToEventBus || []);
  return [...new Set(names)];
};

/**
 * Create a sensible default alarm for a resource and route it to the service's
 * error-notification event bus(es).
 *
 * Opt-in: this is a no-op unless the service declares a `defineNotifyError`. We
 * reuse that config's target bus so default alarms land wherever errors already
 * do (no separate ops-routing concept). If a NotifyError exists but names no
 * bus, the alarm is still created (visible in console / dashboards) but unrouted.
 */
export const createDefaultResourceAlarm = (scope: Construct, qpqConfig: QPQConfig, props: DefaultResourceAlarmProps): void => {
  if (qpqCoreUtils.getNotifyErrorConfigs(qpqConfig).length === 0) {
    return;
  }

  const alarm = new aws_cloudwatch.Alarm(scope, props.id, {
    alarmName: props.alarmName,
    metric: props.metric,
    threshold: props.threshold,
    comparisonOperator: props.comparisonOperator ?? aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    evaluationPeriods: props.evaluationPeriods ?? 1,
    datapointsToAlarm: props.datapointsToAlarm,
  });

  getNotifyErrorEventBusNames(qpqConfig).forEach((busName) => {
    const eventBus = QpqCoreEventBusConstruct.fromOtherStack(scope, `${props.id}-bus-${busName}`, qpqConfig, busName);
    alarm.addAlarmAction(new aws_cloudwatch_actions.SnsAction(eventBus.topic));
  });
};
