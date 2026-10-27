import { CrossModuleOwner } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';

export interface QPQConfigAdvancedSigningKeySettings extends QPQConfigAdvancedSettings {
  owner?: CrossModuleOwner<'signingKeyName'>;
}

// An asymmetric (RSA-2048, RS256) key pair whose private half never leaves the
// provider. Stories sign with askCryptoSign, verify with askCryptoVerify and
// publish the public half with askCryptoGetPublicKey. Distinct from
// defineCryptoKey: a provider key is either encrypt/decrypt or sign/verify, never
// both, so the two are separate resources with separate grants.
export interface SigningKeyQPQConfigSetting extends QPQConfigSetting {
  keyName: string;
}

export const defineSigningKey = (keyName: string, options?: QPQConfigAdvancedSigningKeySettings): SigningKeyQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.signingKey,
  uniqueKey: keyName,

  keyName,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
