import { StoryResultMetadata } from 'quidproquo-core';

import { VolatileLogSearchPartLoadedPayload } from '../../effects/volatile/VolatileLogSearchPartLoadedEffect';
import { VolatileState } from '../../VolatileState';

const byStartedAtDesc = (a: StoryResultMetadata, b: StoryResultMetadata): number => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();

export const logSearchPartLoaded = (state: VolatileState, payload: VolatileLogSearchPartLoadedPayload): VolatileState => {
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
        logs: [...current.logs, ...payload.logs].sort(byStartedAtDesc),
        partsDone: current.partsDone + 1,
      },
    },
  };
};
