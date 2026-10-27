import { QPQConfigAdvancedSettings, QPQConfigSetting } from 'quidproquo-core';

import { ApiLayer, ServiceAccountInfo } from '../../types';
import { QPQAwsConfigSettingType } from '../QPQConfig';

export enum AwsAlarmOperator {
  GreaterThanThreshold = 'GreaterThanThreshold',
  GreaterThanOrEqualToThreshold = 'GreaterThanOrEqualToThreshold',
  LessThanOrEqualToThreshold = 'LessThanOrEqualToThreshold',
  LessThanThreshold = 'LessThanThreshold',
}

export enum AwsAlarmStatistic {
  Minimum = 'Minimum', // or "min"
  Maximum = 'Maximum', // or "max"
  Average = 'Average', // or "avg"
  Sum = 'Sum', // or "sum"
  SampleCount = 'SampleCount', // or "n"
  Percentile = 'pNN.NN', // Pattern for percentile
  TrimmedMean = 'tmNN.NN', // or "tm(NN.NN%:NN.NN%)", Pattern for trimmed mean
  InterquartileMean = 'iqm', // Interquartile mean
  WeightedMean = 'wmNN.NN', // or "wm(NN.NN%:NN.NN%)", Pattern for weighted mean
  TruncatedCount = 'tcNN.NN', // or "tc(NN.NN%:NN.NN%)", Pattern for truncated count
  TruncatedSum = 'tsNN.NN', // or "ts(NN.NN%:NN.NN%)", Pattern for truncated sum
}

export enum AwsAlarmPeriod {
  OneMinute = 1 * 60,
  FiveMinutes = 5 * 60,
  FifteenMinutes = 15 * 60,
}

export enum AwsAlarmNamespace {
  Lambda = 'AWS/Lambda',
  ApiGateway = 'AWS/ApiGateway',
  DynamoDb = 'AWS/DynamoDB',
  Sqs = 'AWS/SQS',
}

export enum AwsAlarmLambdaMetricName {
  Invocations = 'Invocations',
  Errors = 'Errors',
  DeadLetterErrors = 'DeadLetterErrors',
  Duration = 'Duration',
  Throttles = 'Throttles',
  IteratorAge = 'IteratorAge',
  ConcurrentExecutions = 'ConcurrentExecutions',
  UnreservedConcurrentExecutions = 'UnreservedConcurrentExecutions',
}

export enum AwsAlarmApiGatewayMetricName {
  Count = 'Count',
  Latency = 'Latency',
  Error4XX = '4XXError',
  Error5XX = '5XXError',
}

export enum AwsAlarmDynamoDbMetricName {
  ConsumedReadCapacityUnits = 'ConsumedReadCapacityUnits',
  ConsumedWriteCapacityUnits = 'ConsumedWriteCapacityUnits',
  ProvisionedReadCapacityUnits = 'ProvisionedReadCapacityUnits',
  ProvisionedWriteCapacityUnits = 'ProvisionedWriteCapacityUnits',
  ReadThrottleEvents = 'ReadThrottleEvents',
  WriteThrottleEvents = 'WriteThrottleEvents',
  SuccessfulRequestLatency = 'SuccessfulRequestLatency',
  SystemErrors = 'SystemErrors',
  UserErrors = 'UserErrors',
}

export enum AwsAlarmSqsMetricName {
  NumberOfMessagesSent = 'NumberOfMessagesSent',
  NumberOfMessagesReceived = 'NumberOfMessagesReceived',
  NumberOfMessagesDeleted = 'NumberOfMessagesDeleted',
  NumberOfMessagesReceivedButNotDeleted = 'NumberOfMessagesReceivedButNotDeleted',
  SentMessageSize = 'SentMessageSize',
  ReceiveMessageSize = 'ReceiveMessageSize',
  ApproximateNumberOfMessagesDelayed = 'ApproximateNumberOfMessagesDelayed',
  ApproximateNumberOfMessagesVisible = 'ApproximateNumberOfMessagesVisible',
  ApproximateNumberOfMessagesNotVisible = 'ApproximateNumberOfMessagesNotVisible',
  ApproximateAgeOfOldestMessage = 'ApproximateAgeOfOldestMessage',
  ApproximateNumberOfMessagesDelayedNotVisible = 'ApproximateNumberOfMessagesDelayedNotVisible',
}

interface BaseAwsAlarmQPQConfigSetting {
  statistic: AwsAlarmStatistic;
  period: AwsAlarmPeriod;
  operator: AwsAlarmOperator;
  threshold: number;
  datapointsToAlarm: number;
  evaluationPeriodsToAlarm: number;

  onAlarm: {
    publishToEventBus?: string[];
  };
}

// Specific namespace configuration interfaces
interface AwsAlarmLambdaConfigSetting extends BaseAwsAlarmQPQConfigSetting {
  namespace: AwsAlarmNamespace.Lambda;
  metricName: AwsAlarmLambdaMetricName;
}

interface AwsAlarmApiGatewayConfigSetting extends BaseAwsAlarmQPQConfigSetting {
  namespace: AwsAlarmNamespace.ApiGateway;
  metricName: AwsAlarmApiGatewayMetricName;
}

interface AwsAlarmDynamoDbConfigSetting extends BaseAwsAlarmQPQConfigSetting {
  namespace: AwsAlarmNamespace.DynamoDb;
  metricName: AwsAlarmDynamoDbMetricName;
}

interface AwsAlarmSqsConfigSetting extends BaseAwsAlarmQPQConfigSetting {
  namespace: AwsAlarmNamespace.Sqs;
  metricName: AwsAlarmSqsMetricName;
}

// Advanced settings interface
export interface QPQConfigAdvancedAwsAlarmSettings extends QPQConfigAdvancedSettings {}

// Union type for namespace specific settings
type AwsAlarmNamespaceSpecificSettings =
  AwsAlarmLambdaConfigSetting | AwsAlarmApiGatewayConfigSetting | AwsAlarmDynamoDbConfigSetting | AwsAlarmSqsConfigSetting;

export interface QPQConfigAdvancedAwsAlarmSettings extends QPQConfigAdvancedSettings {}

export interface AwsAlarmQPQConfigSetting extends QPQConfigSetting {
  name: string;

  alarmSettings: AwsAlarmNamespaceSpecificSettings;
}

export const defineAwsAlarm = (
  name: string,
  alarmSettings: AwsAlarmNamespaceSpecificSettings,
  options?: QPQConfigAdvancedAwsAlarmSettings,
): AwsAlarmQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.awsServiceAlarm,
  uniqueKey: name,

  name,
  alarmSettings,
});
