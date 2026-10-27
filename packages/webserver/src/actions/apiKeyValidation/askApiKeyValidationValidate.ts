import { createActionRequester } from '@qpqjs/core';

import { ApiKeyReference } from '../../config/settings/apiKey';
import { ApiKeyValidationActionType } from './ApiKeyValidationActionType';

export const askApiKeyValidationValidate = createActionRequester<boolean>()({
  actionType: ApiKeyValidationActionType.Validate,
  getPayload: (apiKeyValue: string, apiKeyReferences: ApiKeyReference[]) => ({ apiKeyValue, apiKeyReferences }),
});
