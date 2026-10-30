import { CrossModuleOwner } from '../../../../types';
import { QPQConfigAdvancedSettings } from '../../../QPQConfig';

export type QPQConfigAdvancedParameterSettings = {
  owner?: CrossModuleOwner<'parameterName'>;
  value?: string;
} & QPQConfigAdvancedSettings;
