import { createActionRequester } from '../../types';
import { ConfigActionType } from './ConfigActionType';

export const askConfigGetParameters = createActionRequester<string[]>()({
  actionType: ConfigActionType.GetParameters,
  errorTypes: [
    'Throttling', // request rate exceeded
  ],
  getPayload: (parameterNames: string[]) => ({ parameterNames }),
});
