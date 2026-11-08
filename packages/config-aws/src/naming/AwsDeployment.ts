/** The service-less identity of a deployment: which application and environment, and the feature branch when there is one. */
export type AwsDeployment = {
  application: string;
  environment: string;
  feature?: string;
};
