import fs from 'fs';

import { CreateQpqAppStep } from '../types';

// npm-safe, unscoped, url-friendly: lowercase, starts with a letter,
// letters/digits/hyphens only.
const VALID_APP_NAME = /^[a-z][a-z0-9-]*$/;

const MINIMUM_NODE_MAJOR = 22;

export const preflight: CreateQpqAppStep = {
  name: 'Checking prerequisites',

  run: async ({ targetDirectory, answers }) => {
    if (!VALID_APP_NAME.test(answers.appName)) {
      throw new Error(`"${answers.appName}" is not a valid app name: use lowercase letters, digits and hyphens, starting with a letter.`);
    }

    const nodeMajor = Number(process.versions.node.split('.')[0]);
    if (nodeMajor < MINIMUM_NODE_MAJOR) {
      throw new Error(`quidproquo apps require node >= ${MINIMUM_NODE_MAJOR} (you are on ${process.versions.node}). Upgrade node and re-run.`);
    }

    if (fs.existsSync(targetDirectory)) {
      throw new Error(`${targetDirectory} already exists. Pick a different name or remove it first.`);
    }
  },
};
