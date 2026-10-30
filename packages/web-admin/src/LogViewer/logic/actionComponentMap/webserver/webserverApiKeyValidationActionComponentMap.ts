import { ApiKeyValidationActionType } from '@qpqjs/webserver';

const webserverApiKeyValidationActionComponentMap: Record<string, string[]> = {
  [ApiKeyValidationActionType.Validate]: ['askApiKeyValidationValidate', 'apiKeyValue', 'apiKeyReferences'],
};

export default webserverApiKeyValidationActionComponentMap;
