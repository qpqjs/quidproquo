import { VolatileSearchCompletedPayload } from '../../effects/volatile/VolatileSearchCompletedPayload';
import { VolatileState } from '../../VolatileState';

export const logLogSearchCompleted = (state: VolatileState, payload: VolatileSearchCompletedPayload): VolatileState => {
  const current = state.logLogResults[payload.searchKey];

  if (!current) {
    return state;
  }

  return {
    ...state,
    logLogResults: {
      ...state.logLogResults,
      [payload.searchKey]: {
        ...current,
        isSearching: false,
        fetchedAt: payload.fetchedAt,
      },
    },
  };
};
