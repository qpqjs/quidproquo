export type EventMessageTypeConstraint = string | number;

export type EventMessage<P, T extends EventMessageTypeConstraint> = {
  type: T;
} & (P extends undefined ? {} : { payload: P });

export type AnyEventMessage = EventMessage<any, EventMessageTypeConstraint>;
