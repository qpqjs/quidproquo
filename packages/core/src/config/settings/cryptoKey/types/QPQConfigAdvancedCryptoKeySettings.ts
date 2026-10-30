import { CrossModuleOwner } from '../../../../types';
import { QPQConfigAdvancedSettings } from '../../../QPQConfig';

export type QPQConfigAdvancedCryptoKeySettings = {
  owner?: CrossModuleOwner<'cryptoKeyName'>;
} & QPQConfigAdvancedSettings;
