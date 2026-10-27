import {
  actionResult,
  askEventGetRecordsBase,
  createActionProcessor,
  EventActionType,
  NotifyErrorQueueBaseEventPayload,
  NotifyErrorQueueErrorQueueEvent,
  NotifyErrorQueueEvents,
  NotifyErrorQueueThrottleQueueEvent,
  NotifyErrorQueueTimeoutQueueEvent,
  ProcessorFor,
  QPQConfig,
  QueueEvent,
} from 'quidproquo-core';

import { AnyQueueMessageWithSession, CloudWatchAlarmNotification, EventInput, InternalEventRecord } from './types';

function isCloudWatchAlarmNotification(obj: any): obj is CloudWatchAlarmNotification {
  return typeof obj === 'object' && !!obj.AlarmName && !!obj.Trigger;
}

function isErrorsCloudWatchAlarmNotification(cwn: CloudWatchAlarmNotification): boolean {
  return cwn.Trigger.MetricName === 'Errors' && cwn.Trigger.Namespace === 'AWS/Lambda';
}

function isTimeoutCloudWatchAlarmNotification(cwn: CloudWatchAlarmNotification): boolean {
  return cwn.Trigger.MetricName === 'Timeout' && cwn.Trigger.Namespace === 'AWS/Lambda';
}

function isThrottlesCloudWatchAlarmNotification(cwn: CloudWatchAlarmNotification): boolean {
  return cwn.Trigger.MetricName === 'Throttles' && cwn.Trigger.Namespace === 'AWS/Lambda';
}

function buildQueueBaseEvent(
  messageId: string,
  notifyErrorQueueEvents: NotifyErrorQueueEvents,
  cloudWatchAlarmNotification: CloudWatchAlarmNotification,
): QueueEvent<any> {
  const payload: NotifyErrorQueueBaseEventPayload = {
    newStateReason: cloudWatchAlarmNotification.NewStateReason,
    newStateInAlarm: cloudWatchAlarmNotification.NewStateValue === 'ALARM',
    oldStateInAlarm: cloudWatchAlarmNotification.OldStateValue === 'ALARM',
  };

  const queueEvent = {
    id: messageId,
    message: {
      type: notifyErrorQueueEvents,
      payload,
    },
  };

  return queueEvent;
}

const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [sqsEvent, context] = eventParams as EventInput;

    const records = sqsEvent.Records.map((record) => {
      const parsedInternalEventRecord = JSON.parse(record.body) as AnyQueueMessageWithSession;

      if (isCloudWatchAlarmNotification(parsedInternalEventRecord)) {
        // Error
        if (isErrorsCloudWatchAlarmNotification(parsedInternalEventRecord)) {
          const queueEvent: NotifyErrorQueueErrorQueueEvent = buildQueueBaseEvent(
            record.messageId,
            NotifyErrorQueueEvents.Error,
            parsedInternalEventRecord,
          );

          return queueEvent;
        }

        // Timeout
        else if (isTimeoutCloudWatchAlarmNotification(parsedInternalEventRecord)) {
          const queueEvent: NotifyErrorQueueTimeoutQueueEvent = buildQueueBaseEvent(
            record.messageId,
            NotifyErrorQueueEvents.Timeout,
            parsedInternalEventRecord,
          );

          return queueEvent;
        }

        // Throttle
        else if (isThrottlesCloudWatchAlarmNotification(parsedInternalEventRecord)) {
          const queueEvent: NotifyErrorQueueThrottleQueueEvent = buildQueueBaseEvent(
            record.messageId,
            NotifyErrorQueueEvents.Throttle,
            parsedInternalEventRecord,
          );

          return queueEvent;
        }

        const queueEvent: InternalEventRecord = buildQueueBaseEvent(record.messageId, NotifyErrorQueueEvents.Unknown, parsedInternalEventRecord);

        return queueEvent;
      }

      // TODO: Remove the session from this object
      //       note: we still need to access the session in the story execution for depth and auth etc.
      const internalEventRecord: InternalEventRecord = {
        message: {
          type: parsedInternalEventRecord.type,
          payload: parsedInternalEventRecord.payload,
        },
        id: record.messageId,

        // FIFO queues only
        groupId: record.attributes?.MessageGroupId,
      };

      return internalEventRecord;
    });

    return actionResult(records);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
