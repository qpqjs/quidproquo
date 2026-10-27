import {
  actionResult,
  actionResultError,
  askSecureTokenGenerate,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  SECURE_TOKEN_MAX_BYTE_LENGTH,
} from 'quidproquo-core';

const getProcessSecureTokenGenerate = (qpqConfig: QPQConfig): ProcessorFor<typeof askSecureTokenGenerate> => {
  return async ({ byteLength }) => {
    if (!Number.isInteger(byteLength) || byteLength < 1 || byteLength > SECURE_TOKEN_MAX_BYTE_LENGTH) {
      return actionResultError(
        askSecureTokenGenerate.errorType.InvalidByteLength,
        `A secure token must be a whole number of bytes from 1 to ${SECURE_TOKEN_MAX_BYTE_LENGTH} (got ${byteLength})`,
      );
    }

    // The same secure source generateUuid uses; no Math.random() fallback, a guessable token is
    // worse than none.
    const cryptoApi = globalThis.crypto as Crypto | undefined;
    if (typeof cryptoApi?.getRandomValues !== 'function') {
      return actionResultError(askSecureTokenGenerate.errorType.RandomSourceUnavailable, 'No Web Crypto API available in this runtime');
    }

    const bytes = cryptoApi.getRandomValues(new Uint8Array(byteLength));

    return actionResult(Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''));
  };
};

export const getSecureTokenGenerateActionProcessor = createActionProcessor(askSecureTokenGenerate, getProcessSecureTokenGenerate);
