/**
 * The env vars a selected deployment is delivered through. Service configs and deploy
 * tooling read these at load time, so they are primed before any infrastructure.ts is
 * required. Platform identity vars are declared by the platform (see @qpqjs/config-aws).
 */
export enum QpqDeployEnvVar {
  // The app folder under apps/ and the deployment name within its deploy.config.json.
  deployAppName = 'DEPLOY_APP_NAME',
  deployName = 'DEPLOY_NAME',
  // The service folder whose inf/web/api stacks a cdk run also synths; empty for app-level runs.
  deployServiceName = 'DEPLOY_SERVICE_NAME',

  applicationName = 'APPLICATION_NAME',
  environment = 'ENVIRONMENT',
  featureName = 'FEATURE_NAME',
}
