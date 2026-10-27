import { ApiKeyValidationActionType, askApiKeyValidationValidate } from 'quidproquo-webserver';

const webserverApiKeyValidationActionComponentMap: Record<string, string[]> = {
  [ApiKeyValidationActionType.Validate]: ['askApiKeyValidationValidate', 'apiKeyValue', 'apiKeyReferences'],
};

export default webserverApiKeyValidationActionComponentMap;
