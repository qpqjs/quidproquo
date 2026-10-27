import { createActionRequester } from '../../types';
import { LogLevelEnum } from '../../types/LogLevelEnum';
import { LogActionType } from './LogActionType';

export type LogCreateActionPayload = {
  logLevel: LogLevelEnum;
  msg: string;
  data?: any;
};

export const askLogCreate = createActionRequester<void>()({
  actionType: LogActionType.Create,
  getPayload: (logLevel: LogLevelEnum, msg: string, data?: any) => ({ logLevel, msg, data }),
});
