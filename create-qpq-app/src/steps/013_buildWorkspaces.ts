import { runCommand } from '../lib/runCommand';
import { CreateQpqAppStep } from '../types';

// The workspace lib packages resolve through their built dist/ (package.json
// main), so a fresh scaffold can't `go:dev` until they're tsc'd once. Only
// possible when dependencies were installed.
export const buildWorkspaces: CreateQpqAppStep = {
  name: 'Building workspace packages',

  shouldRun: (answers) => answers.installDependencies,

  run: async ({ targetDirectory }) => {
    await runCommand('npm', ['run', 'build'], { cwd: targetDirectory });
  },
};
