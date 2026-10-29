// `qpq script:new <dir>`, write the user-script template project into a new
// directory. See templates/user-script/README.md for what a script is.
import path from 'path';

import { getPositionalArgs } from '../lib/args';
import { createUserScriptProject } from '../lib/userScriptTemplate';

export const scriptNewCommand = async (argv: string[]): Promise<void> => {
  const [targetDir] = getPositionalArgs(argv, []);
  if (!targetDir) {
    console.error('Usage: qpq script:new <dir>');
    process.exit(1);
  }

  const written = createUserScriptProject(targetDir);

  console.log(`script:new: wrote ${written.length} files to ${path.resolve(targetDir)}`);
  for (const file of written) {
    console.log(`  ${file}`);
  }
  console.log(`Next: cd ${targetDir} && npm run build`);
};
