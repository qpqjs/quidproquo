import { createActionRequester } from '../../types';
import { LogActionType } from './LogActionType';

export type LogDisableEventHistoryActionPayload = {
  enable: boolean;
  reason: string;
};

export const askLogDisableEventHistory = createActionRequester<void>()({
  actionType: LogActionType.DisableEventHistory,
  getPayload: (enable: boolean, reason: string) => ({ enable, reason }),
});
