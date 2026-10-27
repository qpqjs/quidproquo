import { VolatileSearchCompletedPayload } from '../../effects/volatile/VolatileSearchCompletedPayload';
import { VolatileState } from '../../VolatileState';

export const logSearchCompleted = (state: VolatileState, payload: VolatileSearchCompletedPayload): VolatileState => {
  const current = state.logResults[payload.searchKey];

  if (!current) {
    return state;
  }

  return {
    ...state,
    logResults: {
      ...state.logResults,
      [payload.searchKey]: {
        ...current,
        isSearching: false,
        fetchedAt: payload.fetchedAt,
      },
    },
  };
};
