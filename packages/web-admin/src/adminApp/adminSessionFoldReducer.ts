import { QpqReducer } from 'quidproquo-core';
import { buildEventDocFoldReducer, EventDocEvent, foldEventDocLog, ReservedEventDocEffects } from 'quidproquo-features';

import { adminSessionSchemaVersion } from './constants/adminSessionSchemaVersion';
import { AdminSessionEvents } from './effects/session/AdminSessionEvents';
import { AdminSessionEventType } from './effects/session/AdminSessionEventType';
import { chatMessageSent } from './stateUpdaters/session/chatMessageSent';
import { configServiceSelected } from './stateUpdaters/session/configServiceSelected';
import { configSyncRequested } from './stateUpdaters/session/configSyncRequested';
import { correlationClosed } from './stateUpdaters/session/correlationClosed';
import { correlationOpened } from './stateUpdaters/session/correlationOpened';
import { logCheckToggled } from './stateUpdaters/session/logCheckToggled';
import { searchParamsChanged } from './stateUpdaters/session/searchParamsChanged';
import { searchRequested } from './stateUpdaters/session/searchRequested';
import { sessionEnded } from './stateUpdaters/session/sessionEnded';
import { sessionStarted } from './stateUpdaters/session/sessionStarted';
import { tabChanged } from './stateUpdaters/session/tabChanged';
import { AdminSessionState, createInitialAdminSessionState } from './AdminSessionState';

// Domain handlers + the reserved event-doc base effects (INIT_STATE etc.).
// Explicitly annotated so declaration emit stays portable (the inferred type
// would otherwise reference quidproquo-core through quidproquo-features).
export const adminSessionFoldReducer: QpqReducer<AdminSessionState, AdminSessionEvents | ReservedEventDocEffects> = buildEventDocFoldReducer<
  AdminSessionState,
  AdminSessionEvents
>(createInitialAdminSessionState, {
  [AdminSessionEventType.sessionStarted]: sessionStarted,
  [AdminSessionEventType.tabChanged]: tabChanged,
  [AdminSessionEventType.searchParamsChanged]: searchParamsChanged,
  [AdminSessionEventType.searchRequested]: searchRequested,
  [AdminSessionEventType.correlationOpened]: correlationOpened,
  [AdminSessionEventType.correlationClosed]: correlationClosed,
  [AdminSessionEventType.logCheckToggled]: logCheckToggled,
  [AdminSessionEventType.configServiceSelected]: configServiceSelected,
  [AdminSessionEventType.configSyncRequested]: configSyncRequested,
  [AdminSessionEventType.chatMessageSent]: chatMessageSent,
  [AdminSessionEventType.sessionEnded]: sessionEnded,
});

// Fold a session log (saved + pending) into the session state.
export const foldAdminSessionLog = (events: EventDocEvent[]): AdminSessionState =>
  foldEventDocLog(events, {
    seed: createInitialAdminSessionState(),
    reducer: adminSessionFoldReducer as QpqReducer<AdminSessionState, EventDocEvent>,
    migrations: {},
    latestVersion: adminSessionSchemaVersion,
  });
