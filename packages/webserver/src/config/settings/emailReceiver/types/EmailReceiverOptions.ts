import { QpqFunctionRuntime } from '@qpqjs/core';

export type EmailReceiverOptions = {
  // Runs once per received message with an EmailReceivedEvent.
  onEmail: QpqFunctionRuntime;
};
