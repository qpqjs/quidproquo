import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { ApiKeyReference } from '../../config/settings/apiKey';
import { ApiKeyValidationActionType } from './ApiKeyValidationActionType';
import { askApiKeyValidationValidate } from './askApiKeyValidationValidate';

describe('askApiKeyValidationValidate', () => {
  const references: ApiKeyReference[] = [{ name: 'primary' }];

  it('yields a Validate action with the key value and references', () => {
    const { action } = captureRequester(askApiKeyValidationValidate('secret', references));

    expect(action).toEqual({
      type: ApiKeyValidationActionType.Validate,
      payload: { apiKeyValue: 'secret', apiKeyReferences: references },
    });
  });

  it('passes the validity result through', () => {
    const { returned } = captureRequester(askApiKeyValidationValidate('secret', references), true);

    expect(returned).toBe(true);
  });
});
