import { createActionRequester } from 'quidproquo-core';

import { ApiKeyReference } from '../../config/settings/apiKey';
import { ApiKeyValidationActionType } from './ApiKeyValidationActionType';

export const askApiKeyValidationValidate = createActionRequester<boolean>()({
  actionType: ApiKeyValidationActionType.Validate,
  getPayload: (apiKeyValue: string, apiKeyReferences: ApiKeyReference[]) => ({ apiKeyValue, apiKeyReferences }),
});
