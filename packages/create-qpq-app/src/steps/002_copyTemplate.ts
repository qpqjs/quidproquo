import fs from 'fs';

import { CreateQpqAppStep } from '../types';

// Dumb copy of the bundled template (a pruned snapshot of quidproquojs.com,
// taken at publish time) into the target directory. All shaping happens in
// the steps that follow.
export const copyTemplate: CreateQpqAppStep = {
  name: 'Copying template',

  run: async ({ templateDirectory, targetDirectory }) => {
    if (!fs.existsSync(templateDirectory)) {
      throw new Error(
        `Template snapshot missing at ${templateDirectory}: run "npm run snapshot-template" (dev checkout only; published packages ship it).`,
      );
    }

    fs.cpSync(templateDirectory, targetDirectory, { recursive: true });
  },
};
