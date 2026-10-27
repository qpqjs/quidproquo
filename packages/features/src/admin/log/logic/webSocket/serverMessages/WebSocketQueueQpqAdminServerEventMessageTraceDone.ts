import { WebSocketQueueEventMessage } from '../../../../../webSocketQueue';
import { WebSocketQueueQpqAdminServerMessageEventType } from './WebSocketQueueQpqAdminServerMessageEventType';

// Pushed to admin clients when an async log-replay trace finishes (see
// logController.traceLog / trace-replay-plan.md). On success the trace json is already
// stored on the reports drive — the client re-requests the trace route to get its
// signed url.
export type WebSocketQueueQpqAdminServerEventPayloadTraceDone = {
  correlation: string;
  succeeded: boolean;
  errorText?: string;
};

export type WebSocketQueueQpqAdminServerEventMessageTraceDone = WebSocketQueueEventMessage<
  WebSocketQueueQpqAdminServerEventPayloadTraceDone,
  WebSocketQueueQpqAdminServerMessageEventType.TraceDone
>;
