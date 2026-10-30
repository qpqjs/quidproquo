import { CrossModuleOwner } from '../../../../types';
import { QPQConfigAdvancedSettings } from '../../../QPQConfig';

export type QPQConfigAdvancedEventBusSettings = {
  owner?: CrossModuleOwner<'eventBusName'>;

  isFifo?: boolean;
} & QPQConfigAdvancedSettings;
