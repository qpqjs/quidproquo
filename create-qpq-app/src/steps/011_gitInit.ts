import { runCommand } from '../lib/runCommand';
import { CreateQpqAppStep } from '../types';

// A fresh repo with one clean commit. Failure here (no git installed, odd
// global config) shouldn't lose the scaffold: warn and carry on.
export const gitInit: CreateQpqAppStep = {
  name: 'Initialising git repository',

  shouldRun: (answers) => answers.initialiseGit,

  run: async ({ targetDirectory }) => {
    try {
      await runCommand('git', ['init'], { cwd: targetDirectory });
      await runCommand('git', ['add', '-A'], { cwd: targetDirectory });
      await runCommand('git', ['commit', '-m', '"Initial commit from create-qpq-app"'], { cwd: targetDirectory });
    } catch (error) {
      console.warn(`  Skipping git init: ${(error as Error).message}`);
    }
  },
};
