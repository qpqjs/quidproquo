import { VolatileSearchStartedPayload } from '../../effects/volatile/VolatileSearchStartedPayload';
import { VolatileState } from '../../VolatileState';

export const logLogSearchStarted = (state: VolatileState, payload: VolatileSearchStartedPayload): VolatileState => ({
  ...state,
  logLogResults: {
    ...state.logLogResults,
    [payload.searchKey]: {
      logLogs: [],
      partsTotal: payload.partsTotal,
      partsDone: 0,
      isSearching: true,
      fetchedAt: state.logLogResults[payload.searchKey]?.fetchedAt ?? null,
    },
  },
});
