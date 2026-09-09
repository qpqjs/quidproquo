// Single source of truth for every qpq command: its name, the one-line
// summary (shared by `qpq help` and the interactive menu) and a runner.
//
// Command modules are required lazily inside each runner so a simple
// `qpq help` doesn't pay for the whole toolchain, and so ts-node can be
// registered before any command module (or anything it requires) loads.
import { promptText } from '../lib/prompts';

export type CliCommand = {
  name: string;
  // Argument hint shown in the usage text, e.g. '[svc] [stack]'.
  usageArgs?: string;
  summary: string;
  // Extra usage-only detail lines, indented under the summary.
  usageExtra?: string[];
  // Menu-only: commands that need a positional argument (which the menu has
  // no argv to carry) gather it here before running.
  promptArgs?: () => Promise<string[]>;
  run: (commandArgv: string[]) => Promise<void>;
};

// `qpq hooks` needs a hook name; when launched from the menu there is no
// argv to pass it in, so ask.
const promptHookName = async (): Promise<string[]> => [
  await promptText('Hook name (runs qpq:<name>, or plain <name>, in every app/package that defines it):'),
];

/* eslint-disable @typescript-eslint/no-require-imports */
export const cliCommands: CliCommand[] = [
  {
    name: 'go',
    usageArgs: '[svc] [stack]',
    summary: 'Deploy services (interactive; platform from deploy.config.json, default aws).',
    usageExtra: [
      'Pass positional args to skip prompts, e.g. qpq go all all — svc is',
      "'all' | comma-list | account | domain | bootstrap; stack is all|inf|api|web|views.",
      "A full 'all all' (or 'all api') deploy also publishes federated backends.",
    ],
    run: (a) => require('../commands/go').goCommand(a),
  },
  {
    name: 'setup',
    summary: 'Take a cloud environment from empty to deployed: checked steps, run in order (interactive)',
    usageExtra: ["--check prints each step's status; --yes runs them all; --only <ids> runs a subset."],
    run: (a) => require('../commands/setup').setupCommand(a),
  },
  {
    name: 'go:docker',
    summary: 'Same as go (incl. positional args), but deploys in parallel via docker',
    run: (a) => require('../commands/goDocker').goDockerCommand(a),
  },
  {
    name: 'go:dev',
    summary: 'Run the full local dev stack (api + web) in one process',
    run: (a) => require('../commands/goDev').goDevCommand(a),
  },
  {
    name: 'go:dev:api',
    summary: 'Run the local API dev server (hot reload)',
    run: (a) => require('../commands/goDevApi').goDevApiCommand(a),
  },
  {
    name: 'go:dev:web',
    summary: 'Run every views microfrontend dev server',
    run: (a) => require('../commands/goDevWeb').goDevWebCommand(a),
  },
  {
    name: 'migrate',
    usageArgs: '[app]',
    summary: 'Run pending migrations against the LOCAL dev store, once, then exit.',
    usageExtra: [
      'Deployed, migrations run on a stack update; nothing local ever deploys, so',
      'this is how you exercise one before shipping it. Records what it runs, so a',
      'second call is a no-op.',
    ],
    run: (a) => require('../commands/migrate').migrateCommand(a),
  },
  {
    name: 'teardown',
    summary: 'Destroy web/api/inf stacks for selected services (interactive)',
    run: (a) => require('../commands/teardown').teardownCommand(a),
  },
  {
    name: 'clear-resources',
    summary: 'Empty selected buckets/tables (data only, stacks untouched; interactive)',
    run: (a) => require('../commands/clearResources').clearResourcesCommand(a),
  },
  {
    name: 'synth',
    usageArgs: '[service]',
    summary: 'Synth QPQ configs to dist/apps/<app>/infrastructure',
    run: (a) => require('../commands/synth').synthCommand(a),
  },
  {
    name: 'prep',
    summary: 'Regenerate apps/<app>/tsconfig.federated.json',
    run: (a) => require('../commands/prep').prepCommand(a),
  },
  {
    name: 'publish',
    summary: 'Build + upload + deploy federated remotes',
    run: (a) => require('../commands/publish').publishCommand(a),
  },
  {
    name: 'publish:build',
    summary: 'Build federated remotes locally',
    run: (a) => require('../commands/publish').publishBuildCommand(a),
  },
  {
    name: 'publish:upload',
    summary: 'Upload built version dirs (nothing goes live)',
    run: (a) => require('../commands/publish').publishUploadCommand(a),
  },
  {
    name: 'publish:deploy',
    summary: 'Flip manifests to the uploaded versions',
    run: (a) => require('../commands/publish').publishDeployCommand(a),
  },
  {
    name: 'check:circular',
    summary: 'Scan workspace sources for circular imports (fails on cycles; --warn to only report)',
    run: (a) => require('../commands/checkCircular').checkCircularCommand(a),
  },
  {
    name: 'hooks',
    usageArgs: '<name>',
    summary: 'Run qpq:<name> (or plain <name>) in every app/package that defines it (dependency ordered, parallel; --jobs=N)',
    promptArgs: promptHookName,
    run: (a) => require('../commands/hooks').hooksCommand(a),
  },
];
/* eslint-enable @typescript-eslint/no-require-imports */

// Width of the "name [args]" column in the usage text.
const usageColumnWidth = 17;

export const buildUsage = (): string => {
  const commandLines = cliCommands.flatMap((command) => {
    const nameAndArgs = command.usageArgs ? `${command.name} ${command.usageArgs}` : command.name;
    const extraLines = (command.usageExtra ?? []).map((line) => `  ${''.padEnd(usageColumnWidth)}${line}`);
    return [`  ${nameAndArgs.padEnd(usageColumnWidth)}${command.summary}`, ...extraLines];
  });

  return [
    'qpq — build, dev and deploy orchestration for QPQ apps',
    '',
    'Usage: qpq <command> [--app <name>] [--env <name>] [--platform <name>]',
    '       qpq            (no command opens an interactive menu)',
    '',
    'Commands:',
    ...commandLines,
    '',
  ].join('\n');
};
