// `qpq script:new <dir>`, write the user-script template project into a new
// directory. See templates/user-script/README.md for what a script is.
import path from 'path';

import { getPositionalArgs } from '../lib/args';
import { createOutput } from '../lib/out';
import { createUserScriptProject } from '../lib/userScriptTemplate';

const out = createOutput('script:new');

export const scriptNewCommand = async (argv: string[]): Promise<void> => {
  const [targetDir] = getPositionalArgs(argv, []);
  if (!targetDir) {
    out.error('Usage: qpq script:new <dir>');
    process.exit(1);
  }

  const written = createUserScriptProject(targetDir);

  out.log(`script:new: wrote ${written.length} files to ${path.resolve(targetDir)}`);
  for (const file of written) {
    out.log(`  ${file}`);
  }
  out.log(`Next: cd ${targetDir} && npm run build`);
};
