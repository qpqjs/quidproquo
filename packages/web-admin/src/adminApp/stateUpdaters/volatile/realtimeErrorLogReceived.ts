import { StoryResultMetadata } from 'quidproquo-core';

import { VolatileState } from '../../VolatileState';

export const realtimeErrorLogReceived = (state: VolatileState, log: StoryResultMetadata): VolatileState => ({
  ...state,
  realtimeErrorLogs: [log, ...state.realtimeErrorLogs.filter((existing) => existing.correlation !== log.correlation)],
});
