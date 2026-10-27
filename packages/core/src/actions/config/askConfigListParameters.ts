import { createActionRequester } from '../../types';
import { ConfigActionType } from './ConfigActionType';

export const askConfigListParameters = createActionRequester<string[]>()({
  actionType: ConfigActionType.ListParameters,
  errorTypes: [
    'Throttling', // request rate exceeded
  ],
});
