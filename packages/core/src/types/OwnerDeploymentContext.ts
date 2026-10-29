// Where a resource was deployed: its owner's application, module, environment and feature,
// each falling back to the executing service's own when the owner does not say.
export type OwnerDeploymentContext = {
  application: string;
  module: string;
  environment: string;
  feature?: string;
};
