import { AccountSecurityServicesQPQConfigSetting } from 'quidproquo-config-aws';

import {
  aws_cloudwatch,
  aws_cloudwatch_actions,
  aws_guardduty,
  aws_logs,
  aws_securityhub,
  aws_sns,
  aws_sns_subscriptions,
  Duration,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../base/QpqConstructBlock';

export interface QpqAccountSecurityServicesConstructProps extends QpqConstructBlockProps {
  securityServicesConfig: AccountSecurityServicesQPQConfigSetting;

  /** The account CloudTrail's CloudWatch log group - required for cognitoAuthFailureAlert. */
  cloudTrailLogGroup?: aws_logs.ILogGroup;
}

// GuardDuty detectors and Security Hub hubs are one-per-account+region, which is exactly
// why they live in the account stack rather than any app's bootstrap - an app teardown
// must not take the account's threat detection with it.
export class QpqAccountSecurityServicesConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqAccountSecurityServicesConstructProps) {
    super(scope, id, props);

    if (props.securityServicesConfig.enableGuardDuty) {
      new aws_guardduty.CfnDetector(this, 'guardduty-detector', {
        enable: true,
      });
    }

    if (props.securityServicesConfig.enableSecurityHub) {
      // Security Hub's compliance standards require AWS Config recording, which bills per
      // configuration item recorded - enabling this is a deliberate cost decision
      new aws_securityhub.CfnHub(this, 'security-hub');
    }

    // Credential stuffing hitting Cognito directly (bypassing the apis) shows up as
    // cognito-idp NotAuthorizedException events in CloudTrail - alert by email when the
    // failure rate spikes. (Failed logins through qpq routes are covered separately by
    // the per-api 401-rate alarms.)
    const cognitoAuthFailureAlert = props.securityServicesConfig.cognitoAuthFailureAlert;
    if (cognitoAuthFailureAlert) {
      if (!props.cloudTrailLogGroup) {
        throw new Error('cognitoAuthFailureAlert requires a defineAccountCloudTrail with cloudWatchLogs enabled');
      }

      const metricFilter = new aws_logs.MetricFilter(this, 'cognito-auth-failure-filter', {
        logGroup: props.cloudTrailLogGroup,
        filterPattern: aws_logs.FilterPattern.all(
          aws_logs.FilterPattern.stringValue('$.eventSource', '=', 'cognito-idp.amazonaws.com'),
          aws_logs.FilterPattern.stringValue('$.errorCode', '=', 'NotAuthorizedException'),
        ),
        metricNamespace: 'qpq/security',
        metricName: 'cognito-auth-failures',
        metricValue: '1',
      });

      const alertTopic = new aws_sns.Topic(this, 'security-alerts-topic', {
        topicName: 'qpq-account-security-alerts',
      });
      cognitoAuthFailureAlert.emails.forEach((email) => {
        alertTopic.addSubscription(new aws_sns_subscriptions.EmailSubscription(email));
      });

      const alarm = new aws_cloudwatch.Alarm(this, 'cognito-auth-failure-alarm', {
        alarmName: 'qpq-account-cognito-auth-failures',
        metric: metricFilter.metric({
          statistic: 'Sum',
          period: Duration.minutes(5),
        }),
        threshold: cognitoAuthFailureAlert.thresholdPer5Minutes ?? 10,
        comparisonOperator: aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        evaluationPeriods: 1,
        // No sign-in attempts = no datapoints - that is not an alarm state
        treatMissingData: aws_cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      alarm.addAlarmAction(new aws_cloudwatch_actions.SnsAction(alertTopic));
    }
  }
}
