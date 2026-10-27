import { askApplySessionEvent } from './actions/askApplySessionEvent';
import { askSendChatMessage } from './logic/chat/askSendChatMessage';
import { askApplyConfigServiceSelected } from './logic/config/askApplyConfigServiceSelected';
import { askApplyConfigSyncRequested } from './logic/config/askApplyConfigSyncRequested';
import { askLoadServiceNames } from './logic/config/askLoadServiceNames';
import { askReceiveRealtimeErrorLog } from './logic/dashboard/askReceiveRealtimeErrorLog';
import { askRunDashboardErrorSearch } from './logic/dashboard/askRunDashboardErrorSearch';
import { askApplyCorrelationClosed } from './logic/logDetail/askApplyCorrelationClosed';
import { askApplyCorrelationOpened } from './logic/logDetail/askApplyCorrelationOpened';
import { askApplyLogCheckToggled } from './logic/logDetail/askApplyLogCheckToggled';
import { askApplyTabChanged } from './logic/navigation/askApplyTabChanged';
import { askApplySearchParamsChanged } from './logic/search/askApplySearchParamsChanged';
import { askRunLogLogSearch } from './logic/search/askRunLogLogSearch';
import { askRunLogSearch } from './logic/search/askRunLogSearch';
import { askEndSession } from './logic/session/askEndSession';

// The verbs the views get (useQpqRuntime strips the ask prefix:
// api.applySessionEvent, api.endSession, ...).
export const sharedAdminAppApi = {
  askApplyConfigServiceSelected,
  askApplyConfigSyncRequested,
  askApplyCorrelationClosed,
  askApplyCorrelationOpened,
  askApplyLogCheckToggled,
  askApplySearchParamsChanged,
  askApplySessionEvent,
  askApplyTabChanged,
  askEndSession,
  askLoadServiceNames,
  askReceiveRealtimeErrorLog,
  askRunDashboardErrorSearch,
  askRunLogLogSearch,
  askRunLogSearch,
  askSendChatMessage,
};
