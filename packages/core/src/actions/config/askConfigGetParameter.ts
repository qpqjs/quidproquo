import { createActionRequester } from '../../logic/actions';
import { ConfigActionType } from './ConfigActionType';

export const askConfigGetParameter = createActionRequester<string>()({
  actionType: ConfigActionType.GetParameter,
  errorTypes: [
    'Throttled', // request rate exceeded
  ],
  getPayload: (parameterName: string) => ({ parameterName }),
});
