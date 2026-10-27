import { AdminAppState } from '../../AdminAppState';
import { selectSessionState } from './selectSessionState';

// The URL is a projection of session state — never a source of truth after
// boot. Empty values clear their param.
export const selectUrlProjection = (state: AdminAppState): Record<string, string[]> => {
  const session = selectSessionState(state);

  return {
    tab: [`${session.tab}`],
    runtimeType: session.search.runtimeType ? [session.search.runtimeType] : [],
    service: session.search.service ? [session.search.service] : [],
    startIsoDateTime: session.search.startIsoDateTime ? [session.search.startIsoDateTime] : [],
    endIsoDateTime: session.search.endIsoDateTime ? [session.search.endIsoDateTime] : [],
    user: session.search.user ? [session.search.user] : [],
    info: session.search.info ? [session.search.info] : [],
    msg: session.search.msg ? [session.search.msg] : [],
    error: session.search.error ? [session.search.error] : [],
    deep: session.search.deep ? [session.search.deep] : [],
    logLevel: session.search.logLevel ? [session.search.logLevel] : [],
    correlation: session.openCorrelation ? [session.openCorrelation] : [],
  };
};
