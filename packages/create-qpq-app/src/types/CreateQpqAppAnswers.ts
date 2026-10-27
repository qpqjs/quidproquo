import { AppLanguage } from './AppLanguage';

// Everything the pipeline needs to know, collected ONCE (flags first, prompts
// for whatever is still missing) before any step runs: steps never prompt.
export type CreateQpqAppAnswers = {
  appName: string;
  language: AppLanguage;
  domain: string;
  // Docker registry the image is pushed to ('' = local docker store only).
  dockerRegistry: string;
  // Address browsers use for the docker host ('' = localhost).
  dockerHost: string;
  initialiseGit: boolean;
  installDependencies: boolean;
};
