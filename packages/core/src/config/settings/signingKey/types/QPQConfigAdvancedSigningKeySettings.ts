import { CrossModuleOwner } from '../../../../types';
import { QPQConfigAdvancedSettings } from '../../../QPQConfig';

export type QPQConfigAdvancedSigningKeySettings = {
  owner?: CrossModuleOwner<'signingKeyName'>;
} & QPQConfigAdvancedSettings;
