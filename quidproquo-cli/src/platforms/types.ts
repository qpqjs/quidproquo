import { QpqAppDeployEnvironment } from 'quidproquo-deploy-awscdk';

import { ClearResourcesPlan } from '../lib/clearResourcesPlan';
import { DeployPlan, TeardownPlan } from '../lib/deployPrompts';
import { SetupStep } from '../lib/setupStep';

export enum QpqDeployPlatform {
  aws = 'aws',
  docker = 'docker',
}

// A deploy platform driver — everything that happens after "what to deploy"
// has been decided. `qpq go` resolves the app + environment, prompts the plan,
// then hands off here; the platform comes from the environment's entry in
// apps/<app>/deploy.config.json (default aws), so an app can move platforms
// with a config change instead of a different command.
export interface QpqPlatformDriver {
  // Prime process.env with this platform's deploy identity from the resolved
  // environment target (already-set env vars win). Service configs read these
  // vars at load time, so this runs before any infrastructure.ts is required.
  // Returns human-readable descriptions of anything still missing — deploys
  // treat that as fatal, local dev commands ignore it.
  primeDeployIdentity: (target: QpqAppDeployEnvironment | undefined) => string[];

  // Sequential deploy (`qpq go`).
  go: (appName: string, plan: DeployPlan) => Promise<void>;

  // Parallel containerized deploy (`qpq go:docker`) — optional; drivers that
  // have no docker strategy simply omit it.
  goDocker?: (appName: string, plan: DeployPlan) => Promise<void>;

  // Destroy the web/api/inf stacks for selected services (`qpq teardown`) —
  // optional; drivers with no teardown strategy simply omit it.
  teardown?: (appName: string, plan: TeardownPlan) => Promise<void>;

  // Empty the stored data of selected resources without touching the stacks
  // (`qpq clear-resources`) — optional; drivers with no strategy omit it.
  clearResources?: (appName: string, plan: ClearResourcesPlan) => Promise<void>;

  // The ordered checklist that takes an empty cloud environment to a deployed
  // one (`qpq setup`) — optional; drivers with nothing to set up omit it.
  setupSteps?: (appName: string, environment: string) => Promise<SetupStep[]>;

  // Federated remote publishing (`qpq publish[:build|:upload|:deploy]`).
  publish: (appName: string, serviceNames: string[]) => Promise<void>;
  publishBuild: (appName: string, serviceNames: string[]) => Promise<void>;
  publishUpload: (appName: string, serviceNames: string[]) => Promise<void>;
  publishDeploy: (appName: string, serviceNames: string[]) => Promise<void>;
}
