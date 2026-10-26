import { Nullable } from 'quidproquo';

import { SmokeAwsProbeAttempt } from './SmokeAwsProbeAttempt';

// What the probe module reports from inside the sandbox: the AWS variables the script can see,
// whether it could scrape the runner's own credentials from its parent process, who those
// credentials are (STS), and how each AWS call ended. `defaultChain` is the SDK's normal
// credential lookup; `attempts` use the scraped credentials when there are any.
export type SmokeAwsProbeResult = {
  awsEnvNames: string[];
  parentCredentialsFound: boolean;
  identity: Nullable<string>;
  defaultChain: SmokeAwsProbeAttempt;
  attempts: SmokeAwsProbeAttempt[];
};
