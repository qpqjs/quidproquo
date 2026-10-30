import { VolatileState } from '../types/VolatileState';

export const createInitialVolatileState = (): VolatileState => ({
  logResults: {},
  logLogResults: {},
  realtimeErrorLogs: [],
  serviceNames: [],
  logServiceName: '',
});
