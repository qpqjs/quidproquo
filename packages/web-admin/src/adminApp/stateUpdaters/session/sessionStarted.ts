import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionState } from '../../AdminSessionState';
import { SessionStartedData } from '../../effects/session/SessionStartedEvent';

// Seeds the session from the URL the user arrived on: tab, filters, and a
// deep-linked correlation all become part of the folded state, so the audit
// record explains what the user was looking at from the first event.
export const sessionStarted = (state: AdminSessionState, { data }: EventDocEventPayload<SessionStartedData>): AdminSessionState => {
  const { tab, correlation, ...searchSeed } = data.seededParams;

  return {
    ...state,
    username: data.username,
    seededParams: data.seededParams,
    tab: tab ?? state.tab,
    search: { ...state.search, ...searchSeed },
    openCorrelation: correlation ?? state.openCorrelation,
  };
};
