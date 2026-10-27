import { rs256Verify } from 'quidproquo-actionprocessor-node';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askCryptoVerify,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { getCachedPublicKey } from '../../../logic/kms/getCachedPublicKey';
import { kmsSigningErrorMap, signingKeyNotConfiguredMessage } from './kmsSigningErrorMap';
import { resolveSigningKeyAlias } from './utils';

// Verifies locally against the cached public key rather than calling kms:Verify,
// so the hot path (every authenticated request) costs no KMS round trip.
const getProcessCryptoVerify = (qpqConfig: QPQConfig): ProcessorFor<typeof askCryptoVerify> => {
  return async ({ keyName, message, signature }) => {
    const keyAlias = resolveSigningKeyAlias(keyName, qpqConfig);
    if (!keyAlias) {
      return actionResultError(askCryptoVerify.errorType.KeyNotConfigured, signingKeyNotConfiguredMessage(keyName));
    }

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const publicKeyPem = await getCachedPublicKey(keyAlias, region);
      return actionResult(rs256Verify(publicKeyPem, message, signature));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        QpqSigningMalformedSignature: (e) => actionResultError(askCryptoVerify.errorType.MalformedSignature, e.message),
        ...kmsSigningErrorMap(askCryptoVerify.errorType, keyName),
      });
    }
  };
};

export const getCryptoVerifyActionProcessor = createActionProcessor(askCryptoVerify, getProcessCryptoVerify);
