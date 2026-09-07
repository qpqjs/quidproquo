import { EventDocLinkMode } from './EventDocLinkMode';

// A typed pointer from one EventDoc to another (e.g. a content item -> a stylesheet). Any
// EventDoc can embed these to reference another doc; resolution to concrete rendered output
// happens later, driven by the processing mode (draft | published) + an effective-at time.
// `eventDocService`/`eventDocType` are plain strings so this stays app-agnostic — callers
// supply their own service/type enum values.
type EventDocLinkTarget = {
  eventDocService: string;
  eventDocType: string;
  id: string;
};

export type EventDocLink =
  | (EventDocLinkTarget & { mode: EventDocLinkMode.Latest })
  | (EventDocLinkTarget & {
      mode: EventDocLinkMode.Version;
      documentVersion: number;
    })
  | (EventDocLinkTarget & { mode: EventDocLinkMode.Exact; eventId: number });
