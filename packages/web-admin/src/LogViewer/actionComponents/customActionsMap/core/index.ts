import coreContextActionComponentMap from './coreContextActionComponentMap';
import coreLogActionComponentMap from './coreLogActionComponentMap';
import coreNetworkActionComponentMap from './coreNetworkActionComponentMap';

export default {
  ...coreNetworkActionComponentMap,
  ...coreLogActionComponentMap,
  ...coreContextActionComponentMap,
};
