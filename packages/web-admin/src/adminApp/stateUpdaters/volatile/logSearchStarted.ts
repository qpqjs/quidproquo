import { VolatileSearchStartedPayload } from '../../effects/volatile/VolatileSearchStartedPayload';
import { VolatileState } from '../../VolatileState';

export const logSearchStarted = (state: VolatileState, payload: VolatileSearchStartedPayload): VolatileState => ({
  ...state,
  logResults: {
    ...state.logResults,
    [payload.searchKey]: {
      logs: [],
      partsTotal: payload.partsTotal,
      partsDone: 0,
      isSearching: true,
      fetchedAt: state.logResults[payload.searchKey]?.fetchedAt ?? null,
    },
  },
});
