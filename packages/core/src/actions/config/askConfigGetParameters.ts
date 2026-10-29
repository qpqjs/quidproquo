import { createActionRequester } from '../../logic/actions';
import { ConfigActionType } from './ConfigActionType';

export const askConfigGetParameters = createActionRequester<string[]>()({
  actionType: ConfigActionType.GetParameters,
  errorTypes: [
    'Throttling', // request rate exceeded
  ],
  getPayload: (parameterNames: string[]) => ({ parameterNames }),
});
