import { useContext } from 'react';

import { LoadFederatedAddons } from '../FederatedAddon';
import { FederatedAddonContext } from '../FederatedAddonProvider';

export const useLoadFederatedAddons = (): LoadFederatedAddons => useContext(FederatedAddonContext);
