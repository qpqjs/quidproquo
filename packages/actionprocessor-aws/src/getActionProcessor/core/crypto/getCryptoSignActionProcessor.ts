import { base64UrlEncode } from 'quidproquo-actionprocessor-node';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askCryptoSign,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { signWithKey } from '../../../logic/kms/signWithKey';
import { kmsSigningErrorMap, signingKeyNotConfiguredMessage } from './kmsSigningErrorMap';
import { resolveSigningKeyAlias } from './utils';

const getProcessCryptoSign = (qpqConfig: QPQConfig): ProcessorFor<typeof askCryptoSign> => {
  return async ({ keyName, message }) => {
    const keyAlias = resolveSigningKeyAlias(keyName, qpqConfig);
    if (!keyAlias) {
      return actionResultError(askCryptoSign.errorType.KeyNotConfigured, signingKeyNotConfiguredMessage(keyName));
    }

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const signature = await signWithKey(keyAlias, message, region);
      return actionResult(base64UrlEncode(signature));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, kmsSigningErrorMap(askCryptoSign.errorType, keyName));
    }
  };
};

export const getCryptoSignActionProcessor = createActionProcessor(askCryptoSign, getProcessCryptoSign);
