import { runCommand } from '../lib/runCommand';
import { CreateQpqAppStep } from '../types';

export const npmInstall: CreateQpqAppStep = {
  name: 'Installing dependencies',

  shouldRun: (answers) => answers.installDependencies,

  run: async ({ targetDirectory }) => {
    await runCommand('npm', ['install'], { cwd: targetDirectory });
  },
};
