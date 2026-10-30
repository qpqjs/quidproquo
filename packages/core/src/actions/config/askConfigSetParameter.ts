import { createActionRequester } from '../../logic/actions';
import { ConfigActionType } from './ConfigActionType';

export const askConfigSetParameter = createActionRequester<void>()({
  actionType: ConfigActionType.SetParameter,
  errorTypes: [
    'Throttled', // request rate exceeded
    'QuotaExceeded', // parameter store / storage limit hit
  ],
  getPayload: (parameterName: string, parameterValue: string) => ({ parameterName, parameterValue }),
});
