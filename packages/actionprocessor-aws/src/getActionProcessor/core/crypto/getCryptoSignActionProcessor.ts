import { base64UrlEncode, decodeSigningMessage } from '@qpqjs/actionprocessor-node';
import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askCryptoSign,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { signWithKey } from '../../../logic/kms/signWithKey';
import { kmsSigningErrorMap, signingKeyNotConfiguredMessage } from './utils';
import { resolveSigningKeyAlias } from './utils';

const getProcessCryptoSign = (qpqConfig: QPQConfig): ProcessorFor<typeof askCryptoSign> => {
  return async ({ keyName, message, messageEncoding }) => {
    const keyAlias = resolveSigningKeyAlias(keyName, qpqConfig);
    if (!keyAlias) {
      return actionResultError(askCryptoSign.errorType.KeyNotConfigured, signingKeyNotConfiguredMessage(keyName));
    }

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const signature = await signWithKey(keyAlias, decodeSigningMessage(message, messageEncoding), region);
      return actionResult(base64UrlEncode(signature));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        QpqSigningMalformedMessage: (e) => actionResultError(askCryptoSign.errorType.MalformedMessage, e.message),
        ...kmsSigningErrorMap(askCryptoSign.errorType, keyName),
      });
    }
  };
};

export const getCryptoSignActionProcessor = createActionProcessor(askCryptoSign, getProcessCryptoSign);
