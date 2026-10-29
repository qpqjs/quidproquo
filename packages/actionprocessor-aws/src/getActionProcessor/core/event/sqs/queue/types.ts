import { MatchStoryResult, Nullable, QueueEvent, QueueEventResponse, QueueMessage, StorySession } from '@qpqjs/core';

import { Context, SQSBatchResponse, SQSEvent } from 'aws-lambda';

export type AnyQueueMessageWithSession = QueueMessage<any> & {
  storySession: StorySession;
};

// Externals - The ins and outs of the external event
export type EventInput = [SQSEvent, Context];
export type EventOutput = SQSBatchResponse;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = QueueEvent<QueueMessage<any>>;
export type InternalEventOutput = QueueEventResponse;

export type MatchResult = MatchStoryResult<any, any>;

// Special types
export type CloudWatchAlarmNotification = {
  AlarmName: string;
  AlarmDescription: Nullable<string>;
  AWSAccountId: string;
  AlarmConfigurationUpdatedTimestamp: string;
  NewStateValue: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  NewStateReason: string;
  StateChangeTime: string;
  Region: string;
  AlarmArn: string;
  OldStateValue: string;
  OKActions: string[];
  AlarmActions: string[];
  InsufficientDataActions: string[];
  Trigger: {
    MetricName: string;
    Namespace: string;
    StatisticType: string;
    Statistic: string;
    Unit: Nullable<string>;
    Dimensions: any[];
    Period: number;
    EvaluationPeriods: number;
    ComparisonOperator: string;
    Threshold: number;
    TreatMissingData: string;
    EvaluateLowSampleCountPercentile: string;
  };
};

/** How a runtime learns which queue an event belongs to: the lambda knows from its environment, the dev server reads it off the message. */
export type ResolveQueueName = (eventParams: unknown[]) => string;
