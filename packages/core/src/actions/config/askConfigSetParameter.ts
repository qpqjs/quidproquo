import { createActionRequester } from '../../types';
import { ConfigActionType } from './ConfigActionType';

export const askConfigSetParameter = createActionRequester<void>()({
  actionType: ConfigActionType.SetParameter,
  errorTypes: [
    'Throttling', // request rate exceeded
    'QuotaExceeded', // parameter store / storage limit hit
  ],
  getPayload: (parameterName: string, parameterValue: string) => ({ parameterName, parameterValue }),
});
