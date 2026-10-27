import path from 'path';

import { getArgValue } from '../lib/getArgValue';
import { getOwnPackageRoot } from '../lib/getOwnPackageRoot';
import { getOwnVersion } from '../lib/getOwnVersion';
import { getPositionalArgs } from '../lib/getPositionalArgs';
import { promptSelect } from '../lib/promptSelect';
import { promptText } from '../lib/promptText';
import { createQpqAppSteps } from '../steps';
import { AppLanguage, CreateQpqAppAnswers, StepContext } from '../types';

const USAGE = `Usage: npx create-qpq-app <app-name> [options]

Options:
  --language <typescript|javascript>   skip the language prompt
  --domain <domain>                    app domain (default: <app-name>.example.com)
  --docker-registry <host[:port]>      registry qpq go pushes the image to (e.g. 192.168.8.88:5000)
  --docker-host <address>              address browsers use for the docker host (e.g. 192.168.8.88)
  --no-git                             skip git init
  --no-install                         skip npm install
`;

// Resolve the language from a flag when given, otherwise prompt. Flags keep
// CI and tests non-interactive.
const resolveLanguage = async (argv: string[]): Promise<AppLanguage> => {
  const flagValue = getArgValue(argv, '--language')?.toLowerCase();
  if (flagValue) {
    if (!(flagValue in AppLanguage)) {
      throw new Error(`Unknown --language "${flagValue}", use typescript or javascript.`);
    }
    return AppLanguage[flagValue as keyof typeof AppLanguage];
  }

  const selected = await promptSelect('Which language would you like?', ['TypeScript', 'JavaScript'], 'TypeScript');
  return selected === 'JavaScript' ? AppLanguage.javascript : AppLanguage.typescript;
};

// Where the app will be self-hosted. A flag wins; an interactive terminal is asked, with blank
// meaning "not yet"; a script or CI run without the flag gets blank without a prompt.
const resolveDockerSetting = async (argv: string[], flag: string, question: string): Promise<string> => {
  const flagValue = getArgValue(argv, flag);
  if (flagValue !== undefined) {
    return flagValue.trim();
  }
  return process.stdin.isTTY ? promptText(question) : '';
};

export const runCreateQpqApp = async (argv: string[]): Promise<void> => {
  const [appName] = getPositionalArgs(argv, ['--language', '--domain', '--docker-registry', '--docker-host']);

  if (!appName || argv.includes('--help')) {
    console.log(USAGE);
    process.exit(appName ? 0 : 1);
  }

  // All answers are locked in before the first step runs, no mid-pipeline
  // prompting, so every step sees the same complete answers object.
  const answers: CreateQpqAppAnswers = {
    appName,
    language: await resolveLanguage(argv),
    domain: getArgValue(argv, '--domain') ?? `${appName}.example.com`,
    dockerRegistry: await resolveDockerSetting(
      argv,
      '--docker-registry',
      'Docker registry to push images to (blank for none, e.g. 192.168.8.88:5000)',
    ),
    dockerHost: await resolveDockerSetting(
      argv,
      '--docker-host',
      'Address browsers will use for the docker host (blank for localhost, e.g. 192.168.8.88)',
    ),
    initialiseGit: !argv.includes('--no-git'),
    installDependencies: !argv.includes('--no-install'),
  };

  const context: StepContext = {
    targetDirectory: path.resolve(process.cwd(), appName),
    templateDirectory: path.join(getOwnPackageRoot(), 'template'),
    ownVersion: getOwnVersion(),
    answers,
  };

  for (const step of createQpqAppSteps) {
    if (step.shouldRun && !step.shouldRun(answers)) {
      continue;
    }

    console.log(`\n▸ ${step.name}`);
    await step.run(context);
  }
};
