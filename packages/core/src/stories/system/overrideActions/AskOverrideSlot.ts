import { Action, AskResponse } from '../../../types';

// How an overridden (or nested batch) slot is run. askOverrideActions passes itself in here, so the
// batch splitting never has to import the loop it is part of.
export type AskOverrideSlot = (batchAction: Action<any>) => AskResponse<unknown>;
