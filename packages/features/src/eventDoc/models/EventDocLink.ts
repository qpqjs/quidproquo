import { EventDocLinkMode } from './EventDocLinkMode';

// Plain strings so this stays app-agnostic; callers supply their own service/type enum values.
type EventDocLinkTarget = {
  eventDocService: string;
  eventDocType: string;
  id: string;
};

/** A typed pointer from one EventDoc to another, resolved at render time by mode and effective-at time. */
export type EventDocLink =
  | (EventDocLinkTarget & { mode: EventDocLinkMode.Latest })
  | (EventDocLinkTarget & {
      mode: EventDocLinkMode.Version;
      documentVersion: number;
    })
  | (EventDocLinkTarget & { mode: EventDocLinkMode.Exact; eventId: number });
