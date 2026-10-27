import { LogLog } from 'quidproquo-features';

import { VolatileLogLogSearchPartLoadedPayload } from '../../effects/volatile/VolatileLogLogSearchPartLoadedEffect';
import { VolatileState } from '../../VolatileState';

const byTimestampDesc = (a: LogLog, b: LogLog): number => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

export const logLogSearchPartLoaded = (state: VolatileState, payload: VolatileLogLogSearchPartLoadedPayload): VolatileState => {
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
        logLogs: [...current.logLogs, ...payload.logLogs].sort(byTimestampDesc),
        partsDone: current.partsDone + 1,
      },
    },
  };
};
