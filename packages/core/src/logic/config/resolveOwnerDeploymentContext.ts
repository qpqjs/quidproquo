import { QPQConfig } from '../../config/QPQConfig';
import { CrossModuleOwner } from '../../types/CrossModuleOwner';
import { OwnerDeploymentContext } from '../../types/OwnerDeploymentContext';
import { getApplicationModuleEnvironment } from './getApplicationModuleEnvironment';
import { getApplicationModuleFeature } from './getApplicationModuleFeature';
import { getApplicationModuleName } from './getApplicationModuleName';
import { getApplicationName } from './getApplicationName';

// A resource declared with a CrossModuleOwner belongs to another service. Every owner field
// falls back to the executing service's own deployment context, so every consumer resolves
// the exact place the owning service deployed it. The one definition of that fallback.
export const resolveOwnerDeploymentContext = (qpqConfig: QPQConfig, owner?: CrossModuleOwner): OwnerDeploymentContext => ({
  application: owner?.application || getApplicationName(qpqConfig),
  module: owner?.module || getApplicationModuleName(qpqConfig),
  environment: owner?.environment || getApplicationModuleEnvironment(qpqConfig),
  feature: owner?.feature || getApplicationModuleFeature(qpqConfig),
});
