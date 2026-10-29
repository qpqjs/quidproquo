import { CrossModuleOwner } from '../../../../types';
import { QPQConfigSetting } from '../../../QPQConfig';

export type EventBusQPQConfigSetting = {
  name: string;

  deprecated?: boolean;

  owner?: CrossModuleOwner;

  isFifo: boolean;
} & QPQConfigSetting;
