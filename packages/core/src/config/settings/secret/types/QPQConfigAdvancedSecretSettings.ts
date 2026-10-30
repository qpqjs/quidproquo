import { CrossModuleOwner } from '../../../../types';
import { QPQConfigAdvancedSettings } from '../../../QPQConfig';

export type QPQConfigAdvancedSecretSettings = {
  owner?: CrossModuleOwner<'secretName'>;
} & QPQConfigAdvancedSettings;
