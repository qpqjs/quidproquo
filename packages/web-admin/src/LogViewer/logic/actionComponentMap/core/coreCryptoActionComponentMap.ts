import { CryptoActionType } from 'quidproquo-core';

const coreCryptoActionComponentMap: Record<string, string[]> = {
  [CryptoActionType.Encrypt]: ['askCryptoEncrypt', 'keyName', 'context'],
  [CryptoActionType.Decrypt]: ['askCryptoDecrypt', 'keyName', 'context'],
  [CryptoActionType.Sign]: ['askCryptoSign', 'keyName'],
  [CryptoActionType.Verify]: ['askCryptoVerify', 'keyName'],
  [CryptoActionType.GetPublicKey]: ['askCryptoGetPublicKey', 'keyName'],
};

export default coreCryptoActionComponentMap;
