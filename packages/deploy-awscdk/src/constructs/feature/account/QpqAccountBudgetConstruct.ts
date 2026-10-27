import { AccountBudgetQPQConfigSetting, BudgetThreshold, BudgetThresholdType, qpqConfigAwsUtils } from 'quidproquo-config-aws';

import { aws_budgets, aws_ce } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../base/QpqConstructBlock';

export interface QpqAccountBudgetConstructProps extends QpqConstructBlockProps {
  budgetConfig: AccountBudgetQPQConfigSetting;
}

const defaultThresholds: BudgetThreshold[] = [
  { thresholdPercent: 80, type: BudgetThresholdType.actual },
  { thresholdPercent: 100, type: BudgetThresholdType.forecasted },
  { thresholdPercent: 100, type: BudgetThresholdType.actual },
  { thresholdPercent: 150, type: BudgetThresholdType.actual },
];

export class QpqAccountBudgetConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqAccountBudgetConstructProps) {
    super(scope, id, props);

    const { name, monthlyLimitUsd, subscriberEmails, thresholds = defaultThresholds, anomalyDetection } = props.budgetConfig;

    const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);

    const emailSubscribers = subscriberEmails.map((email) => ({
      subscriptionType: 'EMAIL',
      address: email,
    }));

    new aws_budgets.CfnBudget(this, 'budget', {
      budget: {
        budgetName: `qpq-budget-${accountId}-${name}`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: monthlyLimitUsd,
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: thresholds.map((threshold) => ({
        notification: {
          notificationType: threshold.type === BudgetThresholdType.forecasted ? 'FORECASTED' : 'ACTUAL',
          comparisonOperator: 'GREATER_THAN',
          threshold: threshold.thresholdPercent,
          thresholdType: 'PERCENTAGE',
        },
        subscribers: emailSubscribers,
      })),
    });

    if (!anomalyDetection?.disabled) {
      // AWS allows only one DIMENSIONAL(SERVICE) anomaly monitor per account - declare a
      // single defineAccountBudget per account (or disable anomalyDetection on extras)
      const anomalyMonitor = new aws_ce.CfnAnomalyMonitor(this, 'anomaly-monitor', {
        monitorName: `qpq-anomaly-monitor-${accountId}-${name}`,
        monitorType: 'DIMENSIONAL',
        monitorDimension: 'SERVICE',
      });

      new aws_ce.CfnAnomalySubscription(this, 'anomaly-subscription', {
        subscriptionName: `qpq-anomaly-subscription-${accountId}-${name}`,
        monitorArnList: [anomalyMonitor.attrMonitorArn],
        // DAILY is required for EMAIL subscribers (IMMEDIATE is SNS-only)
        frequency: 'DAILY',
        subscribers: subscriberEmails.map((email) => ({
          type: 'EMAIL',
          address: email,
        })),
        thresholdExpression: JSON.stringify({
          Dimensions: {
            Key: 'ANOMALY_TOTAL_IMPACT_ABSOLUTE',
            MatchOptions: ['GREATER_THAN_OR_EQUAL'],
            Values: [`${anomalyDetection?.minimumImpactUsd ?? 10}`],
          },
        }),
      });
    }
  }
}
