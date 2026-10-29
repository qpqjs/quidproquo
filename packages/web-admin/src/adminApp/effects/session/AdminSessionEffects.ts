import { AdminSessionChatMessageSentEffect } from './AdminSessionChatMessageSentEffect';
import { AdminSessionConfigServiceSelectedEffect } from './AdminSessionConfigServiceSelectedEffect';
import { AdminSessionConfigSyncRequestedEffect } from './AdminSessionConfigSyncRequestedEffect';
import { AdminSessionCorrelationClosedEffect } from './AdminSessionCorrelationClosedEffect';
import { AdminSessionCorrelationOpenedEffect } from './AdminSessionCorrelationOpenedEffect';
import { AdminSessionEndedEffect } from './AdminSessionEndedEffect';
import { AdminSessionLogCheckToggledEffect } from './AdminSessionLogCheckToggledEffect';
import { AdminSessionSearchParamsChangedEffect } from './AdminSessionSearchParamsChangedEffect';
import { AdminSessionSearchRequestedEffect } from './AdminSessionSearchRequestedEffect';
import { AdminSessionStartedEffect } from './AdminSessionStartedEffect';
import { AdminSessionTabChangedEffect } from './AdminSessionTabChangedEffect';

// A session event IS an event-doc event: the fold reduces the full payload
// (data + server-stamped metadata).
export type AdminSessionEffects =
  | AdminSessionStartedEffect
  | AdminSessionTabChangedEffect
  | AdminSessionSearchParamsChangedEffect
  | AdminSessionSearchRequestedEffect
  | AdminSessionCorrelationOpenedEffect
  | AdminSessionCorrelationClosedEffect
  | AdminSessionLogCheckToggledEffect
  | AdminSessionConfigServiceSelectedEffect
  | AdminSessionConfigSyncRequestedEffect
  | AdminSessionChatMessageSentEffect
  | AdminSessionEndedEffect;
