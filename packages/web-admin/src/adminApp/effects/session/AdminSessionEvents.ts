import { ChatMessageSentEvent } from './ChatMessageSentEvent';
import { ConfigServiceSelectedEvent } from './ConfigServiceSelectedEvent';
import { ConfigSyncRequestedEvent } from './ConfigSyncRequestedEvent';
import { CorrelationClosedEvent } from './CorrelationClosedEvent';
import { CorrelationOpenedEvent } from './CorrelationOpenedEvent';
import { LogCheckToggledEvent } from './LogCheckToggledEvent';
import { SearchParamsChangedEvent } from './SearchParamsChangedEvent';
import { SearchRequestedEvent } from './SearchRequestedEvent';
import { SessionEndedEvent } from './SessionEndedEvent';
import { SessionStartedEvent } from './SessionStartedEvent';
import { TabChangedEvent } from './TabChangedEvent';

// A session event IS an event-doc event: the fold reduces the full payload
// (data + server-stamped metadata).
export type AdminSessionEvents =
  | SessionStartedEvent
  | TabChangedEvent
  | SearchParamsChangedEvent
  | SearchRequestedEvent
  | CorrelationOpenedEvent
  | CorrelationClosedEvent
  | LogCheckToggledEvent
  | ConfigServiceSelectedEvent
  | ConfigSyncRequestedEvent
  | ChatMessageSentEvent
  | SessionEndedEvent;
