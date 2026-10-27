import { createActionRequester } from '../../types';
import { ConfigActionType } from './ConfigActionType';

export const askConfigGetParameter = createActionRequester<string>()({
  actionType: ConfigActionType.GetParameter,
  errorTypes: [
    'Throttling', // request rate exceeded
  ],
  getPayload: (parameterName: string) => ({ parameterName }),
});
