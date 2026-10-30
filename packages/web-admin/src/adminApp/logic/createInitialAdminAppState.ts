import { AdminAppState } from '../types/AdminAppState';
import { createInitialSessionLogState } from './createInitialSessionLogState';
import { createInitialVolatileState } from './createInitialVolatileState';

export const createInitialAdminAppState = (): AdminAppState => ({
  sessionLog: createInitialSessionLogState(),
  volatile: createInitialVolatileState(),
});
