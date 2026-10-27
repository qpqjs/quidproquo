import { promptCommandFromMenu } from './commandMenu';
import { buildUsage, CliCommand, cliCommands } from './commandRegistry';

// Service infrastructure.ts files (and app config fragments) are TypeScript —
// register ts-node's transpile-only require hook so the CLI can require them
// directly, using the consumer root's tsconfig.json ts-node settings.
//
// CONTRACT: JavaScript apps (create-qpq-app --language javascript) also lean
// on this hook — their tsconfig.json ts-node block sets allowJs (so their
// ESM-syntax infrastructure.js compiles at require time) and scope/scopeDir
// (so the hook never touches quidproquo libs outside the app). Any
// replacement for ts-node here must honour those consumer tsconfig options.
const registerTsNode = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('ts-node').register({ transpileOnly: true });
};

// Inquirer throws ExitPromptError on ctrl-c; treat that as a quiet exit
// rather than a command failure.
const isPromptExit = (error: unknown): boolean => error instanceof Error && error.name === 'ExitPromptError';

// Bare `qpq` on a terminal: drill through the command menu, gathering any
// arguments the picked command needs. Returns null when the user bails out.
const resolveCommandInteractively = async (): Promise<{ command: CliCommand; commandArgv: string[] } | null> => {
  try {
    const command = await promptCommandFromMenu(cliCommands);
    const commandArgv = command.promptArgs ? await command.promptArgs() : [];

    return { command, commandArgv };
  } catch (error) {
    if (isPromptExit(error)) {
      return null;
    }

    throw error;
  }
};

export const runCli = async (argv: string[]): Promise<void> => {
  const [commandName, ...argvRest] = argv;

  if (commandName === 'help' || commandName === '--help') {
    console.log(buildUsage());
    return;
  }

  let command: CliCommand | undefined;
  let commandArgv: string[] = [];

  if (!commandName) {
    // Only prompt on a real terminal; piped/CI invocations get the usage text.
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.log(buildUsage());
      return;
    }

    const resolved = await resolveCommandInteractively();

    if (!resolved) {
      return;
    }

    ({ command, commandArgv } = resolved);
  } else {
    command = cliCommands.find((c) => c.name === commandName);
    commandArgv = argvRest;

    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      console.log(buildUsage());
      process.exitCode = 1;
      return;
    }
  }

  registerTsNode();

  try {
    await command.run(commandArgv);
  } catch (error) {
    console.error(`qpq ${command.name} failed:`, error);
    process.exitCode = 1;
  }
};
