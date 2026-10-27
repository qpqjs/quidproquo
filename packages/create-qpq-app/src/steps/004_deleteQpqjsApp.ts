import fs from 'fs';
import path from 'path';

import { CreateQpqAppStep } from '../types';

// apps/qpqjs is the real quidproquojs.com website; the starter the user keeps
// is apps/todo. This must run before applyAppIdentity renames apps/todo.
export const deleteQpqjsApp: CreateQpqAppStep = {
  name: 'Removing the qpqjs website app',

  run: async ({ targetDirectory }) => {
    fs.rmSync(path.join(targetDirectory, 'apps', 'qpqjs'), { recursive: true, force: true });
  },
};
