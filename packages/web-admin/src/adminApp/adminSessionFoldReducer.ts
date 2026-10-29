import { QpqReducer } from '@qpqjs/core';
import { buildEventDocFoldReducer, EventDocEvent, foldEventDocLog, ReservedEventDocEffects } from '@qpqjs/features';

import { adminSessionSchemaVersion } from './constants/adminSessionSchemaVersion';
import { AdminSessionEffect } from './effects/session/AdminSessionEffect';
import { AdminSessionEffects } from './effects/session/AdminSessionEffects';
import { createInitialAdminSessionState } from './logic/createInitialAdminSessionState';
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
import { AdminSessionState } from './types/AdminSessionState';

// Domain handlers + the reserved event-doc base effects (INIT_STATE etc.).
// Explicitly annotated so declaration emit stays portable (the inferred type
// would otherwise reference @qpqjs/core through @qpqjs/features).
export const adminSessionFoldReducer: QpqReducer<AdminSessionState, AdminSessionEffects | ReservedEventDocEffects> = buildEventDocFoldReducer<
  AdminSessionState,
  AdminSessionEffects
>(createInitialAdminSessionState, {
  [AdminSessionEffect.SessionStarted]: sessionStarted,
  [AdminSessionEffect.TabChanged]: tabChanged,
  [AdminSessionEffect.SearchParamsChanged]: searchParamsChanged,
  [AdminSessionEffect.SearchRequested]: searchRequested,
  [AdminSessionEffect.CorrelationOpened]: correlationOpened,
  [AdminSessionEffect.CorrelationClosed]: correlationClosed,
  [AdminSessionEffect.LogCheckToggled]: logCheckToggled,
  [AdminSessionEffect.ConfigServiceSelected]: configServiceSelected,
  [AdminSessionEffect.ConfigSyncRequested]: configSyncRequested,
  [AdminSessionEffect.ChatMessageSent]: chatMessageSent,
  [AdminSessionEffect.SessionEnded]: sessionEnded,
});

// Fold a session log (saved + pending) into the session state.
export const foldAdminSessionLog = (events: EventDocEvent[]): AdminSessionState =>
  foldEventDocLog(events, {
    seed: createInitialAdminSessionState(),
    reducer: adminSessionFoldReducer as QpqReducer<AdminSessionState, EventDocEvent>,
    migrations: {},
    latestVersion: adminSessionSchemaVersion,
  });
