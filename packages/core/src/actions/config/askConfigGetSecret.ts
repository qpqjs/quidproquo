import { createActionRequester } from '../../logic/actions';
import { ConfigActionType } from './ConfigActionType';

export const askConfigGetSecret = createActionRequester<string>()({
  actionType: ConfigActionType.GetSecret,
  errorTypes: [
    'ResourceNotFound', // secret does not exist
    'Throttling', // request rate exceeded
  ],
  getPayload: (secretName: string) => ({ secretName }),
});
