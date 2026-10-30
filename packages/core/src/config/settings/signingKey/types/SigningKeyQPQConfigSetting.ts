import { QPQConfigSetting } from '../../../QPQConfig';

// An asymmetric (RSA-2048, RS256) key pair whose private half never leaves the
// provider. Stories sign with askCryptoSign, verify with askCryptoVerify and
// publish the public half with askCryptoGetPublicKey. Distinct from
// defineCryptoKey: a provider key is either encrypt/decrypt or sign/verify, never
// both, so the two are separate resources with separate grants.
export type SigningKeyQPQConfigSetting = {
  keyName: string;
} & QPQConfigSetting;
