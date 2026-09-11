import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askCryptoGetPublicKey,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { getCachedPublicKey } from '../../../logic/kms/getCachedPublicKey';
import { kmsSigningErrorMap, signingKeyNotConfiguredMessage } from './kmsSigningErrorMap';
import { resolveSigningKeyAlias } from './utils';

const getProcessCryptoGetPublicKey = (qpqConfig: QPQConfig): ProcessorFor<typeof askCryptoGetPublicKey> => {
  return async ({ keyName }) => {
    const keyAlias = resolveSigningKeyAlias(keyName, qpqConfig);
    if (!keyAlias) {
      return actionResultError(askCryptoGetPublicKey.errorType.KeyNotConfigured, signingKeyNotConfiguredMessage(keyName));
    }

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      return actionResult(await getCachedPublicKey(keyAlias, region));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, kmsSigningErrorMap(askCryptoGetPublicKey.errorType, keyName));
    }
  };
};

export const getCryptoGetPublicKeyActionProcessor = createActionProcessor(askCryptoGetPublicKey, getProcessCryptoGetPublicKey);
