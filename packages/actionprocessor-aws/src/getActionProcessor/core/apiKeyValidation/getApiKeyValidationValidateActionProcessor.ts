import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { actionResult, createActionProcessor, Nullable, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { ApiKeyReference, ApiKeyValidationActionType, askApiKeyValidationValidate } from 'quidproquo-webserver';

import { timingSafeEqual } from 'crypto';

import { getCFExportNameApiKeyIdFromConfig } from '../../../awsNamingUtils';
import { getApiKeyValue } from '../../../logic/apiGateway/getApiKeyValue';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';

// Constant-time string equality. `timingSafeEqual` throws on length mismatch,
// so guard the length check - the length itself isn't secret for API keys.
const safeEqual = (a: Nullable<string>, b: Nullable<string>): boolean => {
  if (!a || !b || a.length !== b.length) {
    return false;
  }

  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');

  return timingSafeEqual(aBuf, bBuf);
};

const getProcessApiKeyValidationValidate = (qpqConfig: QPQConfig): ProcessorFor<typeof askApiKeyValidationValidate> => {
  const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

  return async ({ apiKeyValue, apiKeyReferences }) => {
    // Fetch each referenced key individually (id via CFN export, then GetApiKey) rather than
    // listing every key in the account - keeps the IAM grant per-key instead of /apikeys-wide.
    // An unresolvable reference behaves like the old list-and-filter miss - no match.
    const fetchRealApiKeyValue = async (apiKeyReference: ApiKeyReference): Promise<Nullable<string>> => {
      try {
        const apiKeyId = await getExportedValue(
          getCFExportNameApiKeyIdFromConfig(apiKeyReference.name, qpqConfig, apiKeyReference.serviceName, apiKeyReference.applicationName),
          region,
        );

        return (await getApiKeyValue(region, apiKeyId)) ?? null;
      } catch {
        return null;
      }
    };

    const realApiKeyValues = await Promise.all(apiKeyReferences.map(fetchRealApiKeyValue));

    const matched = realApiKeyValues.some((realApiKeyValue) => safeEqual(realApiKeyValue, apiKeyValue));
    return actionResult(matched);
  };
};

export const getApiKeyValidationValidateActionProcessor = createActionProcessor(askApiKeyValidationValidate, getProcessApiKeyValidationValidate);
