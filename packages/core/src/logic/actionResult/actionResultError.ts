import { ActionProcessorResult } from '../../types/Action';
import { ErrorTypeEnum } from '../../types/ErrorTypeEnum';

export const actionResultError = (errorType: ErrorTypeEnum | string, errorText: string, errorStack?: string): ActionProcessorResult<any> => {
  return [undefined, { errorType, errorText, errorStack }];
};
