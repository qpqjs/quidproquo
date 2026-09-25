/**
 * The env vars a selected deployment is delivered through. Service configs and deploy
 * tooling read these at load time, so they are primed before any infrastructure.ts is
 * required. Platform identity vars are declared by the platform (see quidproquo-config-aws).
 */
export enum QpqDeployEnvVar {
  // The app folder under apps/ and the deployment name within its deploy.config.json.
  deployAppName = 'DEPLOY_APP_NAME',
  deployName = 'DEPLOY_NAME',

  applicationName = 'APPLICATION_NAME',
  environment = 'ENVIRONMENT',
  featureName = 'FEATURE_NAME',
}
